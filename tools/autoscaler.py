import MySQLdb
import time
import random
import hashlib

from datetime import datetime
from docker import Client
from influxdb import InfluxDBClient


client = InfluxDBClient(host='127.0.0.1', port=8086, database='monitoring')

cli = Client(base_url='tcp://163.180.117.44:4243')

cpu = 0
period = 0


def inspect_broker_status(broker_id):
    query = "select mean(value) from cpu where container_name='%s' " \
            "and time > now() - %ds" % (broker_id, period)

    try:
        d = [c for c in client.query(query=query)][0][0]
    except Exception as e:
        return False

    value = d['mean']
    clients = count_connected_client(broker_id)

    if value > cpu and clients > 0:
        if not is_already_scaled(broker_id):
            return True
    return False


def count_connected_client(broker_id):
    sql = "select count(id) from client_clients where brokers_id='%s'" % broker_id
    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')
    cursor = db.cursor()
    cursor.execute(sql)
    return int(cursor.fetchone()[0])


def create_new_broker():
    bid = hashlib.sha256(str(random.random()).encode()).hexdigest()
    port = get_last_port() + 1

    c = cli.create_container(image='broker:0.1', detach=True, environment={
        'DB_HOST': 'http://163.180.117.45:8080',
        'MQTT_CLUSTER_HOST': 'tcp://163.180.117.48:1883',
        'MQTT_CLUSTER_BROKER_ID': bid
    }, ports=[1883], name=bid,
                             host_config=cli.create_host_config(
                                 port_bindings={
                                     1883: port}))
    cli.start(container=c)

    sql = "insert into broker_brokers(id, container_id, port, created, " \
          "baremetal_id, scaled) values ('%s', '%s', '%d', '%s', 1, 0)"\
          % (bid, c['Id'], port, datetime.now())

    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')
    cursor = db.cursor()
    cursor.execute(sql)
    db.commit()
    db.close()


def get_last_port():
    sql = "select port from broker_brokers order by port desc limit 1"
    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')
    cursor = db.cursor()
    cursor.execute(sql)
    return int(cursor.fetchone()[0])


def is_already_scaled(broker_id):
    sql = "select scaled from broker_brokers where id='%s'" % broker_id

    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')
    cursor = db.cursor()
    cursor.execute(sql)
    db.close()
    return cursor.fetchone()[0]


def mark_as_scaled(broker_id):
    sql = "update broker_brokers set scaled=1 where id='%s'" % broker_id

    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')
    cursor = db.cursor()
    cursor.execute(sql)
    db.commit()
    db.close()


def get_settings():
    global cpu
    global period
    sql = "select value from settings where id='%s'"

    db = MySQLdb.connect("127.0.0.1", "root", "asdfasdf",
                         "netchallenge", charset='utf8')

    cursor = db.cursor()
    cursor.execute(sql % 'cpu')
    cpu = cursor.fetchone()[0]

    cursor = db.cursor()
    cursor.execute(sql % 'period')
    period = cursor.fetchone()[0]
    db.close()


def iter_containers():
    containers = cli.containers()
    for c in containers:
        name = c['Names'][0][1:]
        if name == 'manager':
            continue
        yield name


def work():
    while True:
        get_settings()

        for c in iter_containers():
            if inspect_broker_status(c):
                create_new_broker()
                mark_as_scaled(c)

        time.sleep(1)


if __name__ == '__main__':
    work()

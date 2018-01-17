#-*-coding: utf-8 -*-
import requests
import requests

from backend import app, config
from backend.model.broker import Broker
from backend.model.client import Client
from backend.common.db_connector import db_session

from flask import jsonify, request

from sqlalchemy import text
import pymysql

from docker import Client as DClient

conn = pymysql.connect(host='localhost', user='root', password='asdfasdf',db='netchallenge')
curs = conn.cursor()

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


@app.route('/client', methods=['POST'])
def register_connected_client():
    data = request.get_json()
    client_mqtt_id = data['client_mqtt_id']
    last_connected = data['last_connected']
    broker_id = data['broker_id']

    broker = Broker.query.filter_by(id=broker_id).first()
    if broker is None:
        return 'Broker not found', 404

    client = Client.get_by_client_mqtt_id(client_mqtt_id)
    if client is None:
        client = Client(client_mqtt_id, last_connected, broker)
        db_session.add(client)
    else:
        client.brokers_id = broker_id
        client.last_connected = last_connected
    db_session.commit()

    data['edge'] = config.EDGE_NAME
    if client_mqtt_id.startswith('client'):
        data['developer_id'] = 'test'
        data['app_id'] = 'app1'
    else:
        data['developer_id'] = 'test2'
        data['app_id'] = 'app1'

    url = config.CENTRAL_CLOUD_HOST+"/cloud/client"
    requests.post(url=url, json=data)

    return ''


@app.route('/admin/clients', methods=['GET'])
def get_connected_clients():
    clients = Client.query.all()
    return jsonify(clients=[c.as_dict() for c in clients])


@app.route('/get_id', methods=['POST'])
def get_clients_id():
    sql = 'select client_mqtt_id from client_clients order by last_connected desc limit 1'
    curs.execute(sql)
    result = curs.fetchall()
    res = str(result)
    rows = res.split('\'')
    print rows[1]
    return rows[1]


@app.route('/client', methods=['DELETE'])
def remove_disconnected_client():
    data = request.get_json()
    client_mqtt_id = data['client_mqtt_id']

    client = Client.query.filter_by(client_mqtt_id=client_mqtt_id)

    if 'broker_id' in data:
        broker_id = data['broker_id']
        client = client.filter_by(brokers_id=broker_id)

    client = client.first()

    if client is None:
        return "Client doesn't exist", 404

    data['broker_id'] = client.brokers_id
    data['edge'] = config.EDGE_NAME
    if client_mqtt_id.startswith('client'):
        data['developer_id'] = 'test'
        data['app_id'] = 'app1'
    else:
        data['developer_id'] = 'test2'
        data['app_id'] = 'app1'

    url = config.CENTRAL_CLOUD_HOST+"/cloud/client"
    requests.delete(url=url, json=data)

    db_session.delete(client)
    db_session.commit()
    return ''


@app.route('/admin/test/client', methods=['POST'])
def increase_test_clients():
    cli = DClient(base_url='tcp://163.180.117.44:4243')
    data = request.get_json()
    clients = int(int(data['clients']) / 20)

    for i in range(clients):
        container = cli.create_container(image='client', detach=True, environment={
                     'RUN_MODE': 'publish', 'TEST_CASE': '1', 'QOS': '1', 'THREAD': '20'
                    })
        cli.start(container=container.get('Id'))
    return '클라이언트 추가 완료'


@app.route('/admin/test/stop', methods=['GET'])
def stop_test():
    Client.query.delete()
    Broker.query.delete()
    db_session.commit()

    cli = DClient(base_url='tcp://163.180.117.44:4243')
    containers = cli.containers()
    for c in containers:
        cli.stop(container=c['Id'])
        cli.remove_container(container=c['Id'])

    return '테스트 종료'


@app.route('/admin/test/start', methods=['GET'])
def start_test():
    req = requests.get('http://163.180.117.48:5000/reset')
    return '테스트 시작'
from backend import app
from backend.model.client import Client, Broker

from flask import render_template, request

import paho.mqtt.client as mqtt
import paho.mqtt.publish as publish
import json


@app.route('/dashboard', methods=['GET'])
def dashboard_index():
    clients = Client.query.all()
    return render_template('group.html', clients=clients)

@app.route('/test', methods=['GET'])
def test_client():
    clients = Client.query.all()
    return render_template('test.html', clients=clients)

@app.route('/mimic', methods=['GET'])
def mimic():
    client = mqtt.Client()
    client.connect("163.180.117.44", 55500)
    return 'success'

@app.route('/del_client', methods=['GET'])
def del_client():
    client = mqtt.Client()
    client.connect("163.180.117.44", 55500)
    return 'success'

@app.route('/send_message', methods=['POST'])
def send_message():

    data = request.get_json()

    #brokers = dict()
    #for client in data['clients']:
        #if client['broker_id'] not in brokers:
            #brokers[client['broker_id']] = list()
        #brokers[client['broker_id']].append(client['client_id'])

    client = mqtt.Client()
    client.connect('163.180.117.195', 1883)
    add = data['topic'] + '/' + data['msg']

    for b in data['clients']:
        client.publish('/'+str(b['client_id']), add)
        print(b['client_id'])

    client.disconnect()
    #print(brokers)
    return 'done'
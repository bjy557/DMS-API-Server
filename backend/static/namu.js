/**
 * Created by nexusz99 on 16. 8. 24.
 */

 $(function() {

    //$("#container-speed2").hide();
    //$("#container-rpm2").hide();

    var gaugeOptions = {

        chart: {
            type: 'solidgauge',
            backgroundColor: 'transparent'
        },

        title: null,

        pane: {
            center: ['50%', '70%'],
            size: '100%',
            startAngle: -125,
            endAngle: 125,
            background: {
                backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || '#EEE',
                innerRadius: '80%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },

        tooltip: {
            enabled: false
        },

        // the value axis
        yAxis: {
            stops: [
                [0.1, '#55BF3B'], // green
                [0.3, '#DDDF0D'], // yellow
                [0.6, '#DF5353'] // red
                ],
                lineWidth: 0,
                minorTickInterval: null,
                tickPixelInterval: 400,
                tickWidth: 0,
                title: {
                    y: 35
                },
                labels: {
                    y: 18
                }
            },

            plotOptions: {
                solidgauge: {
                    dataLabels: {
                        y: 5,
                        borderWidth: 0,
                        useHTML: true
                    }
                }
            }
        };

    // The speed gauge
    $('#container-speed').highcharts(Highcharts.merge(gaugeOptions, {
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'CPU'
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'Speed',
            data: [0],
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:20px;color:' + ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.2f}</span><br/></div>'
            },
            tooltip: {
                valueSuffix: ' km/h'
            },
            innerRadius: '80%',
            outerRadius: '100%',
        }]

    }));

    // The RPM gauge
    $('#container-rpm').highcharts(Highcharts.merge(gaugeOptions, {
        yAxis: {
            min: 0,
            max: 25000,
            title: {
                text: 'Net I/O'
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'RPM',
            data: [0],
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:20px;color:' + ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/></div>'
            },
            tooltip: {
                valueSuffix: ' revolutions/min'
            },
            innerRadius: '80%',
            outerRadius: '100%',
        }]

    }));
    // The speed gauge
    $('#container-speed2').highcharts(Highcharts.merge(gaugeOptions, {
        yAxis: {
            min: 0,
            max: 100,
            title: {
                text: 'CPU'
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'Speed',
            data: [0],
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:20px;color:' + ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y:.2f}</span><br/></div>'
            },
            tooltip: {
                valueSuffix: ' km/h'
            },
            innerRadius: '80%',
            outerRadius: '100%',
        }]

    }));

    // The RPM gauge
    $('#container-rpm2').highcharts(Highcharts.merge(gaugeOptions, {
        yAxis: {
            min: 0,
            max: 25000,
            title: {
                text: 'Net I/O'
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'RPM',
            data: [0],
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:20px;color:' + ((Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black') + '">{y}</span><br/></div>'
            },
            tooltip: {
                valueSuffix: ' revolutions/min'
            },
            innerRadius: '80%',
            outerRadius: '100%',
        }]

    }));

    load_brokers();
});


setInterval(load_brokers, 1000);



function load_brokers() {
    $.ajax({
        type: "GET",
        url: "/admin/brokers",
        success: function(data) {
            var content = "<tr><td>브로커 ID</td><td>컨테이너 ID</td>"+
            "<td>포트 번호</td><td>생성 시각</td><td>접속 수</td>" +
            "<td>CPU(%)</td>" +
            "<td>Network In(bytes/s)</td><td>Network Out(bytes/s)</td><td>Last Check</td></tr>";

            var brokers = data['brokers'];
            var flag = 0;

            for(var k = 0 ; k < brokers.length ; k++)
            {
                flag += 1;
            }

            for(var k = 0 ; k < brokers.length; k++) {
                var d = '<tr>';
                var b = brokers[k];
                d += "<td>"+b.id.slice(0,9)+"</td>";
                d += "<td>"+b.container_id.slice(0,9)+"</td>";
                d += "<td>"+b.port+"</td>";
                d += "<td>"+b.created+"</td>";

                if(flag == 1)
                {
                    d += "<td>"+b.clients+"</td>";
                }
                if(flag >= 2)
                {
                    if(k == 0)
                    {
                        d += "<td>"+parseInt(brokers[0].clients * 3 / 5)+"</td>";
                    }
                    if(k >= 1)
                    {
                        d += "<td>"+parseInt(brokers[0].clients * 2 / 5)+"</td>";
                    }
                }
                d += "<td>"+b.cpu+"</td>";
                console.log('jhj '  + b.cpu);
                d += "<td>"+b.network_in+"</td>";
                d += "<td>"+b.network_out+"</td>";
                d += "<td>"+b.last_check+"</td></tr>";
                content += d;

                // Speed
                var chart = $('#container-speed').highcharts(),
                point;

                if (k==0)
                {
                    if (chart) {
                        point = chart.series[0].points[0];

                        point.update(parseFloat(b.cpu));
                    }

                    // RPM
                    chart = $('#container-rpm').highcharts();
                    if (chart) {
                        point = chart.series[0].points[0];

                        point.update(b.network_in);
                    }    
                }


                if (k==1)
                {
                    //$("#container-speed2").show();
                   // $("#container-rpm2").show();

                    // Speed
                    var chart = $('#container-speed2').highcharts(),
                    point;

                    if (chart) {
                        point = chart.series[0].points[0];

                        point.update(parseFloat(b.cpu));
                    }

                    // RPM
                    chart = $('#container-rpm2').highcharts();
                    if (chart) {
                        point = chart.series[0].points[0];

                        point.update(b.network_in);
                    }
                }



            }

            $("#broker_list").html(content)
        }
    });

}


function send_message() {
    var clients = [];
    var topic = document.getElementById('msg_topic').value;
    var body = document.getElementById('msg_body').value;


    $("input:checkbox[name=client]:checked").each(function(){
        var id = $(this).val();
        var bid = document.getElementById(id).innerText;
        var client = {'client_id': id, 'broker_id': bid};
        clients.push(client);
    });

    req_body = {'clients': clients, 'topic': topic, 'msg': body};

    $.ajax({
        type: "POST",
        data: JSON.stringify(req_body),
        contentType: 'application/json',
        url: '/send_message',
        success: function (msg) {
            alert(msg)
        }
    });

    document.getElementById('msg_topic').value = "";
    document.getElementById('msg_body').value = "";
}


function get_autoscale_setting() {
    $.ajax({
        type: "GET",
        url: '/admin/setting',
        success: function (msg) {
            var cpu = msg['cpu'];
            var period = msg['period'];

            document.getElementById('cpu_threshold').value = cpu;
            document.getElementById('threshold_period').value = period;
        }
    });
}


function autoscale_setting() {
    var cpu = document.getElementById('cpu_threshold').value;
    var period = document.getElementById('threshold_period').value;

    req_body = {'cpu': cpu, 'period': period};
    $.ajax({
        type: "POST",
        data: JSON.stringify(req_body),
        contentType: 'application/json',
        url: '/admin/setting',
        success: function (msg) {
            alert(msg);
        }
    });
}

function add_clients() {
    var clients = document.getElementById('clients_amount').value;
    req_body = {'clients': clients};
    $.ajax({
        type: "POST",
        data: JSON.stringify(req_body),
        contentType: 'application/json',
        url: '/admin/test/client',
        success: function (msg) {
            alert('클라이언트 추가 완료');
            window.location.reload();
        }
    });
    document.getElementById('clients_amount').value = "";
}

function abort_test() {
    $.ajax({
        type: "GET",
        url: '/admin/test/stop',
        success: function (msg) {
            alert(msg);
            window.location.reload();
        }
    });
}

function start_test() {

    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'http://163.180.117.48:5000/reset');


    $.ajax({
        type: "GET",
        url: '/admin/test/start',
        success: function (msg) {
            alert(msg);
            window.location.reload();
        }
    });

}

function delete_clients() {
    $("input:checkbox[name=client]").each(function(){
        var id = $(this).val();
        req_body = {'client_mqtt_id': id}
        $.ajax({
            type: "DELETE",
            data: JSON.stringify(req_body),
            contentType: 'application/json',
            url: '/client',
            success: function() {
                var content = "<tr><td>선택</td><td>클라이언트 ID</td>"+
                "<td>브로커 ID</td><td>최근 연결 시간</td></tr>"
                $("#client_list").html(content)
            }
        });
    });
}

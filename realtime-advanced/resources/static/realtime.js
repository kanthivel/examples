

function StartRealtime(roomid, timestamp) {
    StartEpoch(timestamp);
    StartSSE(roomid);
    StartForm();
}

function StartForm() {
    $('#chat-message').focus();
    $('#chat-form').ajaxForm(function() {
        $('#chat-message').val('');
        $('#chat-message').focus();
    });
}

function StartEpoch(timestamp) {
    var windowSize = 60;
    var height = 200;
    var defaultData = histogram(windowSize, timestamp);
    window.goroutinesChart = $('#goroutinesChart').epoch({
        type: 'time.bar',
        axes: ['bottom', 'left'],
        height: height,
        data: [
            {values: defaultData}
        ]
    });

    window.heapChart = $('#heapChart').epoch({
        type: 'time.area',
        axes: ['bottom', 'left'],
        height: height,
        data: [
            {values: defaultData},
            {values: defaultData}
        ]
    });

    window.mallocsChart = $('#mallocsChart').epoch({
        type: 'time.area',
        axes: ['bottom', 'left'],
        height: height,
        data: [
            {values: defaultData},
            {values: defaultData}
        ]
    });
}

function StartSSE(roomid) {
    if (!window.EventSource) {
        alert("EventSource is not enabled in this browser");
        return;
    }
    var source = new EventSource('/stream/'+roomid);
    source.addEventListener('message', newChatMessage, false);
    source.addEventListener('stats', stats, false);
}

function stats(e) {
    var data = parseJSONStats(e.data)
    heapChart.push(data.heap)
    mallocsChart.push(data.mallocs)
    goroutinesChart.push(data.goroutines)
}

function parseJSONStats(e) {
    var data = jQuery.parseJSON(e);
    var timestamp = data.timestamp;

    var heap = [
        {time: timestamp, y: data.HeapInuse},
        {time: timestamp, y: data.StackInuse}
    ];

    var mallocs = [
        {time: timestamp, y: data.Mallocs},
        {time: timestamp, y: data.Frees}
    ];
    var goroutines = [
        {time: timestamp, y: data.NuGoroutines},
    ]
    return {
        heap: heap,
        mallocs: mallocs,
        goroutines: goroutines
    }
}

function newChatMessage(e) {
    var data = jQuery.parseJSON(e.data);
    var nick = escapeHtml(data.nick);
    var message = escapeHtml(data.message);

    var html = "<tr><td>"+nick+"</td><td>"+message+"</td></tr>";
    $('#chat').append(html);

    $("#chat-scroll").scrollTop($("#chat-scroll")[0].scrollHeight);
}

function histogram(windowSize, timestamp) {
    var entries = new Array(windowSize);
    for(var i = 0; i < windowSize; i++) {
        entries[i] = {time: (timestamp-windowSize+i-1), y:0};
    }
    return entries;
}

var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
};


function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
}

window.StartRealtime = StartRealtime
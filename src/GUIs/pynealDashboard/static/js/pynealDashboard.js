// Config vars
var numTimepts = 0;     // tmp value for total number of timePts
var currentVolIdx = 0;
var motion = [];        // empty array to hold motion objects
var timePerVol = [];    // empty array to hold timing objects

// --------- READ INCOMING SOCKET MESSAGES ----
var socket = io('http://127.0.0.1:' + location.port);
socket.on('connect', function() {
    // we emit a connected message to let know the server that we are connected.
    socket.emit('client_connected', {data: 'New client!'});
    console.log("sent request for data")
});


// handle when server sends all existing data
socket.on('existingData', function(msg){
    console.log('received all existing data:');
    console.log(msg);

    // set all vars according to values in existing data
    numTimepts = msg.numTimepts;
    currentVolIdx = msg.currentVolIdx;
    motion = msg.motion;
    timePerVol = msg.timePerVol;

    // update all plots
    drawAll();
})


// handle messages about configuration settings
socket.on('configSettings', function(msg){
    // get total timePts
    console.log(msg)
    numTimepts = msg.numTimepts;
    drawAll();

});


// handle incoming messages about current volIdx
socket.on('volIdx', function(msg) {
    currentVolIdx = msg
    updateCurrentVol()
    updateProgressBar()
});


// handle incoming messages about current motion params
socket.on('motion', function(msg) {
    // 'msg' will be JSON object with vals for volIdx, and any other motion
    // parameters you want. Add it to the 'motion' array, then update plot
    motion.push(msg);
    updateMotionPlot();
});


// handle incoming messages about current timing params
socket.on('timePerVol', function(msg) {
    // 'msg' will be JSON object with vals for volIdx, and any other motion
    // parameters you want. Add it to the 'motion' array, then update plot
    timePerVol.push(msg);
    //drawMotionPlot();
    updateTimingPlot();
});


// hande incoming messages about communication with pyneal-scanner
socket.on('pynealScannerLog', function(msg){
    // the logString will appear as new log message in log box
    pynealScannerLog_newMsg(msg.logString)
})


// handle incoming messages about communication on the results server
socket.on('resultsServerLog', function(msg){
    if (msg.type == 'request') {
        resultsServer_newRequest(msg.logString);
    } else if (msg.type == 'response') {
        resultsServer_newResponse(msg.logString, msg.success);
    }
})

// Progress Area behavior ---------------------------------------------
var progressBar = d3.select('#progressBarDiv')
                    .append('svg')
                    .attrs({'width':'95%', 'height': '100%'});


progressBar.append('rect')
    .attrs({x: 0, y:30,
            width:'100%', height:30,
            fill:'white',
            stroke: 'rgb(100, 100, 100)',
            'stroke-alignment': 'inner'});


progressBar.append('rect')
    .attrs({id: 'progressBarRect', x: 0, y:30,
            width:1, height:30,
            fill:'#A44754'});


function updateCurrentVol(){
    d3.select('#currentVol').html(String(currentVolIdx+1));
}


function updateProgressBar() {
    d3.select('#progressBarRect')
        .transition()
        .attr('width', ((currentVolIdx+1)/numTimepts)*100 + '%');
}


// Motion Area behavior ---------------------------------------------
var motionScale_x, motionAxis_x;
var motionScale_y, motionAxis_y;
var motionPlotWidth, motionPlotHeight;
var rms_abs_line, rms_rel_line;

function drawMotionPlot() {
    var motionPlotDiv = d3.select('#motionPlotDiv');
    motionPlotDiv.html("")      // clear the existing contents

    var margin = {top: 10, right:10, bottom: 30, left:40};

    // get the current dimensions of the div
    var divBBox = motionPlotDiv.node().getBoundingClientRect();
    var divWidth = divBBox.width;
    var divHeight = divBBox.height;
    motionPlotWidth = divWidth - margin.left - margin.right;
    motionPlotHeight = divHeight - margin.top - margin.bottom;

    // size the svg for the plot
    var motionPlotSVG = motionPlotDiv.append('svg')
                        .attrs({'id': 'motionPlotSVG', 'width':divWidth, 'height':divHeight})
                        .append('g')
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //figure out max motion param to scale plots
    var rms_abs_min = d3.min(motion, function(d){ return d.rms_abs})
    var rms_rel_min = d3.min(motion, function(d){ return d.rms_rel})
    var rms_abs_max = d3.max(motion, function(d){ return d.rms_abs})
    var rms_rel_max = d3.max(motion, function(d){ return d.rms_rel})
    var upper_yLim = 1.2* d3.max([rms_abs_max, rms_rel_max]);
    var lower_yLim = 1.2* d3.min([rms_abs_min, rms_rel_min]);
    var y_range = upper_yLim - lower_yLim

    // Set up the scales and axes
    motionScale_x = d3.scaleLinear()
                    .domain([0,numTimepts])
                    .range([0,motionPlotWidth]);
    motionAxis_x = d3.axisBottom()
                    .scale(motionScale_x)

    motionScale_y = d3.scaleLinear()
                    .domain([lower_yLim, upper_yLim])
                    .range([motionPlotHeight, 0])
    motionAxis_y = d3.axisLeft()
                    .scale(motionScale_y)
                    .ticks(5);

    // define the lines
    rms_abs_line = d3.line()
            .x(function(d){ return motionScale_x(d.volIdx+1)})
            .y(function(d){ return motionScale_y(d.rms_abs)});
    rms_rel_line = d3.line()
            .x(function(d){ return motionScale_x(d.volIdx+1)})
            .y(function(d){ return motionScale_y(d.rms_rel)});


    motionPlotSVG.append('path')
        .datum(motion)
        .attr('id', 'rms_abs_line')
        .attr('d', rms_abs_line);
    motionPlotSVG.append('path')
        .datum(motion)
        .attr('id', 'rms_rel_line')
        .attr('d', rms_rel_line);

    // call the axes to draw it to the div
    motionPlotSVG.append('g')
        .attr("id", "motionPlot_xAxis")
        .attr("transform", "translate(0," + (upper_yLim/y_range)*motionPlotHeight + ")")
        .call(motionAxis_x);

    motionPlotSVG.append('g')
        .attr("id", "motionPlot_yAxis")
        .call(motionAxis_y);
    motionPlotSVG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (motionPlotHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .text("displacement (mm)");

    // append a legend
    legendData = ['abs', 'rel']
    var motionLegend = motionPlotSVG.selectAll('.legendKey')
        .data(legendData)
        .enter()
        .append('g')
        .attr('transform', function (d,i){
            var xOffset = motionPlotWidth*.75 + i*50;
            return "translate(" + xOffset + ",10)";
        })
        .attr('class', 'legendKey')
    motionLegend.append('rect')
        .attrs({'x':0, 'y':0, 'width':12, 'height':12})
        .style('fill', function(d){
            if (d=='abs'){
                return '#265971';
            } else if (d=='rel') {
                return '#5CC2F0';
            }
        });
    motionLegend.append('text')
        .attrs({'x': 20, 'y':12})
        .text(function(d) {return d})
        .style('font-size', 12);
}

function updateMotionPlot(){
    // rescale the y-axis if needed
    var rms_abs_min = d3.min(motion, function(d){ return d.rms_abs})
    var rms_rel_min = d3.min(motion, function(d){ return d.rms_rel})
    var rms_abs_max = d3.max(motion, function(d){ return d.rms_abs})
    var rms_rel_max = d3.max(motion, function(d){ return d.rms_rel})
    var upper_yLim = 1.5* d3.max([rms_abs_max, rms_rel_max]);
    var lower_yLim = 1.5* d3.min([rms_abs_min, rms_rel_min]);
    lower_yLim = (lower_yLim < 0 ) ? lower_yLim : 0;
    var y_range = upper_yLim - lower_yLim

    motionScale_y.domain([lower_yLim, upper_yLim])

    d3.select("#motionPlot_xAxis")
        .attr("transform", "translate(0," + (upper_yLim/y_range)*motionPlotHeight + ")")
        .call(motionAxis_x);
    d3.select("#motionPlot_yAxis")
            .call(motionAxis_y);

    // update motion plot with new current motion data
    d3.select('#rms_abs_line')
        .datum(motion)
        .transition()
        .attr('d', rms_abs_line);
    d3.select('#rms_rel_line')
        .datum(motion)
        .transition()
        .attr('d', rms_rel_line);
}

// Timing Area behavior ---------------------------------------------
var timingScale_x, timingAxis_x;
var timingScale_y, timingAxis_y;
var timingPlotWidth, timingPlotHeight;

function drawTimingPlot() {
    var timingPlotDiv = d3.select('#timingPlotDiv');
    timingPlotDiv.html("")      // clear the existing contents

    var margin = {top: 10, right:10, bottom: 30, left:40};

    // get the current dimensions of the div
    var divBBox = timingPlotDiv.node().getBoundingClientRect();
    var divWidth = divBBox.width;
    var divHeight = divBBox.height;
    timingPlotWidth = divWidth - margin.left - margin.right;
    timingPlotHeight = divHeight - margin.top - margin.bottom;

    // size the svg for the plot
    var timingPlotSVG = timingPlotDiv.append('svg')
                        .attrs({'id': 'timingPlotSVG', 'width':divWidth, 'height':divHeight})
                        .append('g')
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //figure out max timing param to scale plots
    var timePerVol_max = d3.max(timePerVol, function(d){ return d.processingTime})
    var compute_upper_yLim = function(m){
        if (m > 1){
            return 1.2*m;
        } else {
            return 1;
        }
    };
    var upper_yLim = compute_upper_yLim(timePerVol_max);

    // Set up the scales and axes
    timingScale_x = d3.scaleLinear()
                    .domain([0,numTimepts])
                    .range([0,timingPlotWidth]);
    timingAxis_x = d3.axisBottom()
                    .scale(timingScale_x)

    timingScale_y = d3.scaleLinear()
                    .domain([0, upper_yLim])
                    .range([timingPlotHeight, 0])
    timingAxis_y = d3.axisLeft()
                    .scale(timingScale_y)
                    .ticks(5);

    // define the lines
    volTime_line = d3.line()
            .x(function(d){ return timingScale_x(d.volIdx+1)})
            .y(function(d){ return timingScale_y(d.processingTime)});

    timingPlotSVG.append('path')
        .datum(timePerVol)
        .attr('id', 'volTime_line')
        .attr('d', volTime_line);

    // call the axes to draw it to the div
    timingPlotSVG.append('g')
        .attr("id", "timingPlot_xAxis")
        .attr("transform", "translate(0," + timingPlotHeight + ")")
        .call(timingAxis_x);

    timingPlotSVG.append('g')
        .attr("id", "timingPlot_yAxis")
        .call(timingAxis_y);
    timingPlotSVG.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (timingPlotHeight / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .text("time (s)");
}

function updateTimingPlot(){
    // rescale the y-axis if needed
    var timePerVol_max = d3.max(timePerVol, function(d){ return d.processingTime});
    var compute_upper_yLim = function(m){
        if (m > 1){
            return 1.2*m;
        } else {
            return 1;
        }
    };
    var upper_yLim = compute_upper_yLim(timePerVol_max);


    timingScale_y.domain([0, upper_yLim])

    d3.select("#timingPlot_xAxis")
        .call(timingAxis_x);
    d3.select("#timingPlot_yAxis")
            .call(timingAxis_y);

    // update timing plot with new current timing data
    d3.select('#volTime_line')
        .datum(timePerVol)
        .attr('d', volTime_line);
}


// Pyneal Scanner Log Area Behavior -----------------------------------------
function pynealScannerLog_newMsg(logMsg){
    // add the parent div for the new request
    var newLogMsg = d3.select('#pynealScannerLogBox')
                        .append('div')
                        .attr('class','pynealScannerMsg');

    //add the indicator circle
    newLogMsg.append('div')
        .attr('class','pynealScannerIndicator')
        .append('svg')
            .attrs({'width':'100%', 'height':'100%'})
            .append('circle')
            .attrs({'cy':'50%', 'cx':'50%', 'r':8});

    // add the request message
    newLogMsg.append('div')
        .attr('class','pynealScannerLogMsg')
        .html(logMsg);

    // update the scroll window
    updatePynealScannerScroll();
};


function updatePynealScannerScroll(){
    var logBox = d3.select('#pynealScannerLogBox')

    var scrollHeight = logBox.node().scrollHeight;

    // if the user has scrolled to w/in 90% of the bottom, keep
    // moving the scroll down. This will prevent it auto updating if
    // the user has scroll back up to check a value
    if ((logBox.node().scrollTop + logBox.node().offsetHeight) >= .9*scrollHeight){
        logBox.node().scrollTop = scrollHeight;
    }
};

// Results Server Area behavior ---------------------------------------------
function resultsServer_newRequest(logMsg){
    // add the parent div for the new request
    var newRequest = d3.select('#resultsServerLogBox')
                        .append('div')
                        .attr('class','resultsRequest');

    //add the indicator circle
    newRequest.append('div')
        .attr('class','requestIndicator')
        .append('svg')
            .attrs({'width':'100%', 'height':'100%'})
            .append('circle')
            .attrs({'cy':'50%', 'cx':'50%', 'r':8});

    // add the request message
    newRequest.append('div')
        .attr('class','requestMsg')
        .html('requested vol idx: ' + logMsg);

    // update the scroll window
    updateResultsServerScroll();
};


function resultsServer_newResponse(logMsg, success){
    // set the indicator class based on success
    if (success == true){
        var indicatorClass = 'responseSuccess';
    } else {
        var indicatorClass = 'responseFail';
    };

    // add the parent div for the new request
    var newResponse = d3.select('#resultsServerLogBox')
                        .append('div')
                        .attr('class','resultsResponse');

    //add the indicator circle
    newResponse.append('div')
        .attr('class','responseIndicator')
        .append('svg')
            .attrs({'width':'100%', 'height':'100%'})
            .append('circle')
            .attr('class', indicatorClass)
            .attrs({'cy':'50%', 'cx':'50%', 'r':8});

    // add the request message
    newResponse.append('div')
        .attr('class','responseMsg')
        .html('response: ' + logMsg);

    // update the scroll window
    updateResultsServerScroll();
};


function updateResultsServerScroll(){
    var logBox = d3.select('#resultsServerLogBox')

    var scrollHeight = logBox.node().scrollHeight;

    // if the user has scrolled to w/in 90% of the bottom, keep
    // moving the scroll down. This will prevent it auto updating if
    // the user has scroll back up to check a value
    if ((logBox.node().scrollTop + logBox.node().offsetHeight) >= .9*scrollHeight){
        logBox.node().scrollTop = scrollHeight;
    }
};


// draw all elements upon load ------------------------------------------------
drawAll()
function drawAll(){
    updateCurrentVol();
    updateProgressBar();
    drawMotionPlot()
    drawTimingPlot();
};

// Redraw based on the new size whenever the browser window is resized.
window.addEventListener("resize", function(){
    drawAll();
});

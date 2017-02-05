function initiateCalendar(){
  //populate days of week
  populateCalendar();
  //removes days in past
  removePastDays();
  //removes days that maids have unavailable, needs php function
  removeNonMaidDays();
  //sets possible start times and hides times that are too late to start a cleaning.
  findPossibleStartTimes(2);
  //remove scheduled jobs // idea: look at jobs sharing area with maids sharing area//
  removeScheduledJobs();
  //highlight times available based on how much time the customer chooses.

  //highlight days that are optimum green to yellow.

  //make times that do not have enough duration between unCell and EndCells unavailable
  checkdurationException(2);

  //make days that have all unavailable cells into unavailable days
  cleanUnavailableDays();
}

var numDay = 0;

function returnDate(){
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; //January is 0!
var yyyy = today.getFullYear();

if(dd<10) {
    dd='0'+dd;
}

if(mm<10) {
    mm='0'+mm;
}

today = +mm+'/'+dd+'/'+yy;
return today;
}

function createDayArray(){
  //get day values from php
  daysArray = [0, 1, 0, 1, 1, 1, 0];
  return daysArray;
}

function createMultiArray(){
  daysArray = createDayArray();
  var dayInfo = [
    [daysArray[0], "mondayCells", "mon", "cell0", "Monday"],
    [daysArray[1], "tuesdayCells", "tue", "cell1", "Tuesday"],
    [daysArray[2], "wednesdayCells", "wed", "cell2","Wednesday"],
    [daysArray[3], "thursdayCells", "thu", "cell3", "Thursday"],
    [daysArray[4], "fridayCells", "fri", "cell4", "Friday"],
    [daysArray[5], "saturdayCells", "sat", "cell5", "Saturday"],
    [daysArray[6], "sundayCells", "sun", "cell6", "Sunday"]
  ];
  return dayInfo;
}
//need a php function to get zip codes of maids that will be relevant.

function removeNonMaidDays(){
  //get day values
  multiArray = createMultiArray();
  for(var i=multiArray.length; i--;){
    if(multiArray[i][0] === 0){
      var x = document.getElementsByClassName("day"+i+"");
      for (var y = 0; y < x.length; y++) {
          x[y].className = 'day'+i+' unavailable';
      }
    }
  }
}

function removePastDays(){
//remove days in the past from calendar
  var today = new Date();
  var lastDayofWeek = rawDateofWeek(6);
  for(var i=0; i<7; i++)
  {

    var curDate = rawDateofWeek(i);

    Date.parse(curDate);

    if(curDate < today)
    {
      var x = document.getElementsByClassName("day"+i);
      for (var y = 0; y < x.length; y++) {
          x[y].className = 'day'+i+' unavailable';
      }

      //disable reverse button
      document.getElementById("previousWeekButton").disabled = true;
    }

    else if(curDate > today)
    {
      var s = document.getElementsByClassName("day"+i);
      for (var e = 0; e < s.length; e++) {
          s[e].className = 'day'+i+'';
      }
      // enable reverse button
      document.getElementById("previousWeekButton").disabled = false;
    }
  }

  //disable or enable forward week button based on two months
  var monthThreshold = 2;
  var twoMonthsFromToday  = today.setMonth(today.getMonth()+monthThreshold);

  if(lastDayofWeek > twoMonthsFromToday){
    document.getElementById("nextWeekButton").disabled = true;
  }
  if(lastDayofWeek < twoMonthsFromToday){
    document.getElementById("nextWeekButton").disabled = false;
  }
}

function rawDateofWeek(dayVal){
  var a = new Date();
  a = new Date(a.getTime()+((dayVal+numDay)*24*60*60*1000));
  return a;
}

function dateofWeek(dayVal){
    var a = new Date();
    a = new Date(a.getTime()+((dayVal+numDay)*24*60*60*1000));
    var traditionalDate = (a).toString().split(' ').splice(1,3).join(' ');

    var monthLong = (a).toString().split(' ').splice(1,1).join(' ');
    var day = (a).toString().split(' ').splice(1,2).join(' ');
    var yearLong = (a).toString().split(' ').splice(2,2).join(' ');
    // if(monthLong == 12){}
    var dayCut = day.substr(4);
    var year = yearLong.substr(5);
    var dateFinal = monthLong+"/"+dayCut+"/"+year;

    return traditionalDate;
}

function loadDates(){
  var multiArray = createMultiArray();
  for(var i=0; i<multiArray.length; i++){
    document.getElementById(multiArray[i][4].toLowerCase()).innerHTML = dateofWeek(i);
  }
}

function nextWeek(){
    numDay=numDay+7;
    loadDates();
    initiateCalendar();
}

function previousWeek(){
    numDay=numDay-7;
    loadDates();
    initiateCalendar();
}

window.onload = function() {
  loadDates();
};

function dateFormat(date){
  var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
  var m = monthNames[date.getMonth()];
  var d = date.getUTCDate();
  var y = date.getFullYear();

  var myDate= m + ' ' + d + ' ' + y;
  return myDate;
}

function timeformat(date) {
  var h = date.getHours();
  var m = date.getMinutes();
  var x = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  m = m < 10 ? '0'+m: m;
  var mytime= h + ':' + m + ' ' + x;
  return mytime;
}

//add thirty minutes
// var newDateObj = new Date();
// //adds thirty minutes to time.
// newDateObj.setTime(oldDateObj.getTime() + (30 * 60 * 1000));


$( document ).ready(function() {

initiateCalendar();

$('#cancelButton').click(function(event) {
  $('#bookingForm').hide();
  $('#bookingCalendar').fadeIn('slow');
});

//get cell information on click.
$('.dayCell').click(function(event) {
    var cellInfo = $(this).attr('id');
    var bookingTime = cellInfo.substring(3);
    var day = cellInfo.substring(0, 3);
    var dayInfo = "unknown";
    var dayName = "";
    var multiArray = createMultiArray();

    for(var i=0; i < 7; i++){
      if(day == multiArray[i][2]){
        dayInfo = rawDateofWeek(i);
        dayName = multiArray[i][4];
      }
    }
    var dateInfo = dateFormat(dayInfo);
    //alert time and date of cell
    //alert(cellInfo + " " +dateInfo);
    var displayString = "BOOKING: "+dayName+", "+dateInfo+" "+bookingTime+"";
    $('#bookingCalendar').hide();
    $('#bookingForm').fadeIn('slow');
    fillFormDate(displayString);
});
});

function fillFormDate(dateInfo){
  document.getElementById('bookingTime').innerHTML=dateInfo;
}

function removeScheduledJobs(){
  var dayInfo = "";
  var cellNumber = "";

  //time and day.
  //day matches available day.
  //get all the jobs that share a zip code value as customer/maid.
  //find which ones are on a day that maid has available.

  //day of job
  var day = "fri";
  //start and end of job
  var jobStart = '1130am';
  var jobEnd = '500pm';
  // jobStart = jobStart.replace(':', '');
  // jobEnd = jobEnd.replace(':', '');

  //date of job
  var jobDate = rawDateofWeek(4);

  daysArray = createDayArray();
  multiArray = createMultiArray();

  for(var i = 0; i<daysArray.length; i++){
    if(day == multiArray[i][2]){
        dayInfo = rawDateofWeek(i);
        divID = multiArray[i][1];
        cellNumber = "cell"+i+"";
    }
  }

  var startIndex = 0;
  var endIndex = 0;

  dayDay = dayInfo.getDate();
  dayMonth = dayInfo.getMonth();
  dayYear = dayInfo.getFullYear();
  jobDay = jobDate.getDate();
  jobMonth = jobDate.getMonth();
  jobYear = jobDate.getFullYear();

  dayInfoString = ""+dayDay+""+dayMonth+""+dayYear+"";
  jobDateString = ""+jobDay+""+jobMonth+""+jobYear+"";

  if(dayInfoString == jobDateString){
    var searchElem = document.getElementById(divID).children;
      for(var f = 0; f < searchElem.length; f++) {

        if(searchElem[f].id.indexOf(jobStart) == 3) {
          // searchElem[i].className = "dayCell "+cellNumber+" unCell";
          startIndex = f;
        }

        if(searchElem[f].id.indexOf(jobEnd) == 3) {
          // searchElem[i].className = "dayCell "+cellNumber+" unCell";
          endIndex = f;
        }
      }

      for(var g = startIndex; g < endIndex; g++){
          searchElem[g].className = "dayCell "+cellNumber+" unCell";
      }
  }
}

function findPossibleStartTimes(duration){
  //sets possible start times and hides times that are too late to start a cleaning.
  //get start and end.
  var availDays = [];
  //shows days available.
  daysArray = createDayArray();
  multiArray = createMultiArray();

  for(var i=0; i < daysArray.length; i++){
    if(daysArray[i] == 1){
      availDays.push(multiArray[i][1]);
    }
  }

  if(availDays.length > 0)
    {
      for(var x=0; x < availDays.length; x++)
      {
        var divName = availDays[x];
        var searchElem = document.getElementById(divName).children;
        var numberDisabled = (duration/0.5);
        var numberAvail = (searchElem.length - numberDisabled);
        var totalCells = searchElem.length;
        //make avail times clickable
        for(var r=0; r < numberAvail; r++) {
            searchElem[r].className += " avCell";
        }
        //make unavailable times unavailable
        for(var n=numberAvail; n < totalCells; n++){
            searchElem[n].className += " unCell endCells";
        }
      }
    }
  }


function cleanUnavailableDays(){
  //get days marked as available
  daysArray = createDayArray();

  var dayInfo = createMultiArray();

  for(var i=0; i < daysArray.length; i++){

    var dayNumber = daysArray[i];
    var cellName = dayInfo[i][1];
    var dayName = dayInfo[i][2];
    if(dayNumber==1){
      //day is available
      var charArray = [];
      var searchElem = document.getElementById(cellName).children;
      for(var x=0; x < searchElem.length; x++){
        var characteristic = searchElem[x].className;
        if(characteristic.includes("unCell")){
          charArray.push(characteristic);
        }
      }
      if(charArray.length == 18){
        var myNode = document.getElementById(cellName);
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild);
        }
        $("#"+cellName).append('<div id="'+dayName+'930" class="dayCell unCell cell'+dayNumber+'">Unavailable</div>');
      }
      else{
      }
    }
  }
}

function checkdurationException(duration){
  daysArray = createDayArray();
  multiArray = createMultiArray();
  cleanLength = (duration*2);

  for(var i=0; i < daysArray.length; i++){
    var dayNumber = daysArray[i];
    var columnName = multiArray[i][1];
    var dayName = multiArray[i][2];

    if(dayNumber==1){
        //this day is available
        var searchElem = document.getElementById(columnName).children;
        //search cells within available column
        for(var x=0; x < searchElem.length; x++){
          var add = 1;
          //get cell's class
          var charValue = searchElem[x].className;
          //if cell is available, check to see if it has atleast cleanLength of available, or make unavailable.
          if(charValue.includes("avCell")){
            //check cells in clean duration
            for(var v=1; v <= cleanLength; v++){
              var count = x+v;
              if(count < 18){
                var checkClass = searchElem[count].className;
                if(checkClass.includes("avCell")){

                }else if(checkClass.includes("endCells")){

                }else{
                  searchElem[x].className = "unCell dayCell cell";
                }
              }
            }
          }
        }
      }
    }
  }



// populate Monday Cells
function populateCalendar(){
  var d = new Date();
  d.setHours(9, 00, 00);
  var dateString = "";
  daysArray = createDayArray();
  multiArray = createMultiArray();

  if(document.body.contains(document.getElementById('mon600pm') || document.getElementById('tue930am'))) {
      // calendar exists, do nothing
  }else{
  //calendar doesnt exist, populate calendar
    for (var i = 1; i < 19; i++)
    {
        //get time
        var cellTime = new Date(d.getTime() + i*(30*60000));
        //format
        var date = timeformat(cellTime);
        //format id tag
        dateString = date.toString();
        dateString = dateString.replace(/\s/g, '');
        dateString = dateString.replace(':', '');

        //add days to calendar
        for(var c=0; c<daysArray.length; c++){
            var idName = multiArray[c][1];
            var dayName = multiArray[c][2];
            var cellNum = c;
            if(daysArray[c]==1){
              $('#'+idName).append('<div id="'+dayName+dateString+'" class="dayCell cell'+cellNum+'">'+date.toString()+'</div>');
            }
        }
    }
    //make unavailable days unavailable
    for(var c2=0; c2<daysArray.length; c2++){
        var idName2 = multiArray[c2][1];
        var dayName2 = multiArray[c2][2];
        var cellNum2 = c2;
        if(daysArray[c2]===0){
          $('#'+idName2).append('<div id="'+dayName2+dateString+'" class="dayCell cell'+cellNum2+'">Unavailable, click to make special request</div>');
        }
      }
  }
}

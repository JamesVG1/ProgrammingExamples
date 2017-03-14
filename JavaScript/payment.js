//This is a dynamic scheduling calendar that is used to schedule bookings, but also adjust according to multiple user's availability settings.


// global variables
var numDay = 0; //global variable for counting week.

function initiateCalendar() {
  //hide unavail week div/show columns
  $('#unavailWeek').hide();
  $('.dayColumns').show();
  //populate the divs themselves into dayDivs
  populateDivElements();
  //populate day cells for week
  populateCalendar();
  //removes days in past, and also days x months in the future.
  removePastDays(futureScheduleThreshold);
  //removes days that maids have unavailable.
  removeNonMaidDays();
  //sets possible start times and hides times that are too late to start a cleaning.
  //highlight times available based on how much time the customer chooses.
  findPossibleStartTimes(bookingDuration);
  //remove scheduled jobs // idea: look at jobs sharing area with maids sharing area//if lots of maids available on same day as job, dont remove it.
  removeScheduledJobs(scheduledJobThreshold);
  //highlight days that are optimum green to yellow.
  // colorCodePriceCode();
  //make times that do not have enough duration between unCell and EndCells unavailable
  checkdurationException(bookingDuration);
  //make the current day unavailable. This doesnt work so well on first load..
  //check calendar maxout(too many cleaning jobs already in the current week). Make all days unavailble if maxout reached.
  checkCalendarMaxout(calendarMaxout);
  //make days that have all unavailable cells into unavailable days. If all days are unavailble for the current week show message that whole week is unavailable.
  cleanUnavailableDays();
}

$(document).ready(function() {

    initiateCalendar();
    //cancel on address screen
    $('#cancelButton').click(function(event) {
      $('#bookingForm').hide();
      $('#fieldwarning').hide();
      $('#bookingCalendar').fadeIn(1200);
    });

    //customer accept after entering job information
    $('#bookingButton').click(function(event) {
      validateForm();
    });

    //cancel on stripe payment page
    $('#cancelPaymentButton').click(function(event) {
      $('#stripeDiv').hide();
      $('#fieldwarning').hide();
      $('#bookingForm').fadeIn(1200);
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
          var dayArrayNames = multiArray[i][2];
          //matched clicked day to name of day in array.
          if(day == dayArrayNames){
            dayInfo = rawDateofWeek(i);
            dayName = multiArray[i][4];
            var dateInfo = dateFormat(dayInfo);
            var displayString = "BOOKING: "+dayName+", "+dateInfo+" "+bookingTime+"";
            $('#bookingCalendar').hide();
            $('#bookingForm').fadeIn('slow');
            fillFormDate(dayName, dateInfo, bookingTime);
          }
        }
    });
});


// populate Monday Cells
function populateCalendar(){
    var d = moment();
    //sets time to 9am
    d.hour(9);
    var dateString = "";
    var daysArray = createDayArray();
    var multiArray = createMultiArray();

    //refresh all columns as available
    for(var c=0; c<daysArray.length; c++){
        var idName = multiArray[c][1];
        var characteristic = document.getElementById(idName);
        characteristic.innerHTML = '';
    }
    //refresh all columns as available
    for(var c=0; c<daysArray.length; c++){
        var idName = multiArray[c][1];
        var characteristic = document.getElementById(idName);
        characteristic.className = "day"+c;
    }

    //populate cells for each day
    for (var i = 1; i < 19; i++)
    {
        //get time of the cell
        var cellTime = moment().minutes(0).hour(9).add((30*i), 'm');
        //format
        var date = timeformat(cellTime);
        //format id tag
        dateString = date.toString();
        dateString = dateString.toLowerCase();
        dateString = dateString.replace(':', '');
        dateString = dateString.replace(/\s/g, '');
        //add days to calendar
        for(var c=0; c<daysArray.length; c++){
            var idName = multiArray[c][1];
            var dayName = multiArray[c][2];
            var cellNum = c;
            if(daysArray[c]==1){
              //the day is available; add cells to it.
              $('#'+idName).append('<div id="'+dayName+dateString+'" class="dayCell cell'+cellNum+'">'+date.toString()+'</div>');
            }
        }
    }
}


function calculateJobsThisWeek(){
  //calculates the total number of jobs scheduled for the current week.
  //find the starting point of the week
  var thisDayNumber = findCurrentDayofWeek();
  var firstDateThisWeek = rawDateofWeek(thisDayNumber).hour(1);
  var lastDateThisWeek = rawDateofWeek(thisDayNumber).add(6, 'days').hour(23);
  var jobCounter = 0;
  //calculate number of jobs between the two dates
  for(i=0; i<numberofScheduledJobs; i++){
    var jobDate = jobDateArray[i];
    var momentDate = moment(jobDate).hour(12);
    if(firstDateThisWeek < momentDate && momentDate < lastDateThisWeek)
    {
      jobCounter++;
    }
  }
  return jobCounter;
}

function populateDivElements() {
    var multiArray = createMultiArray();
    //this populates the class name and id name of div element to match corrisponding day.
    //this means that the main class or id of these elements cannot change
    // column0, monday (should be mondayTitle), mondayCells (id, should be class), class day0
    //column0, title0, 0Cells day0; these should all be id's.
    var currentDayNumber = findCurrentDayofWeek();
    var rotationCounter = currentDayNumber;
    //see if the divs already exist, search by columnID
    var column0 = document.getElementById('column0');

    if(!column0) {
        for(i=0;i<multiArray.length;i++){
            var dayCounter = rotationCounter;
            if(rotationCounter > 6){
              dayCounter = (rotationCounter - 7);
            }
            //this number is used in the array, and then used to populate the divs.
            var columnID = "column"+dayCounter;
            var dayName = (multiArray[dayCounter][4]).toLowerCase();
            var columnClass = dayName+"Column";
            var titleName = (multiArray[dayCounter][4]).toLowerCase();
            var cellDiv = (multiArray[dayCounter][1]);
            var dayNumber = "day"+dayCounter;

            // id = dayDiv, append divs to this div, and everything should work
            $('#dayDivs').append('<div id="'+columnID+'" class="'+columnClass+' dayColumns col-lg-1 col-md-2 col-sm-4 col-xs-6"><center><div id="'+dayName+'"></div></center><br/><div id="'+cellDiv+'" class="'+dayNumber+'"></div></div>');
            rotationCounter++;
        }
        //find first column and add col-lg-offset-2 to make it more centered.
        var columnOffset = "column"+currentDayNumber;
        document.getElementById(columnOffset).className += " col-lg-offset-2";
      }
}


function removePastDays(futureScheduleThreshold){
//remove days in the past from calendar
  var today = moment();
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

  //disable or enable forward week button based on monthThreshold variable.
  var futureScheduleThreshold = 2;
  var twoMonthsFromToday  = today.add(futureScheduleThreshold, 'months');

  if(lastDayofWeek > twoMonthsFromToday){
    document.getElementById("nextWeekButton").disabled = true;
  }
  if(lastDayofWeek < twoMonthsFromToday){
    document.getElementById("nextWeekButton").disabled = false;
  }
}

// populate Monday Cells
function populateCalendar(){
    var d = moment();
    //sets time to 9am
    d.hour(9);
    var dateString = "";
    var daysArray = createDayArray();
    var multiArray = createMultiArray();

    //refresh all columns as available
    for(var c=0; c<daysArray.length; c++){
        var idName = multiArray[c][1];
        var characteristic = document.getElementById(idName);
        characteristic.innerHTML = '';
    }
    //refresh all columns as available
    for(var c=0; c<daysArray.length; c++){
        var idName = multiArray[c][1];
        var characteristic = document.getElementById(idName);
        characteristic.className = "day"+c;
    }

    //populate cells for each day
    for (var i = 1; i < 19; i++)
    {
        //get time of the cell
        var cellTime = moment().minutes(0).hour(9).add((30*i), 'm');
        //format
        var date = timeformat(cellTime);
        //format id tag
        dateString = date.toString();
        dateString = dateString.toLowerCase();
        dateString = dateString.replace(':', '');
        dateString = dateString.replace(/\s/g, '');
        //add days to calendar
        for(var c=0; c<daysArray.length; c++){
            var idName = multiArray[c][1];
            var dayName = multiArray[c][2];
            var cellNum = c;
            if(daysArray[c]==1){
              //the day is available; add cells to it.
              $('#'+idName).append('<div id="'+dayName+dateString+'" class="dayCell cell'+cellNum+'">'+date.toString()+'</div>');
            }
        }
    }
}


function checkCalendarMaxout(calendarMaxout) {
  //number of jobs scheduled this week, adjusted each week.
  var jobsThisWeek = calculateJobsThisWeek();

  if(jobsThisWeek>=calendarMaxout){
    //max out reached, close all days for this week.
    for (var i=7; i--;){
        var x = document.getElementsByClassName("day"+i+"");
        for (var y = 0; y < x.length; y++) {
            x[y].className = 'day'+i+' unavailable';
      }
    }
  }
}

//adds class unavilable to columns that maids set to unavailable.
function removeNonMaidDays(){
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

function findCurrentDayofWeek(){
  //in moment js sunday is 0, monday is 1, etc..
  var currentDayNumber = moment().day();
  return currentDayNumber;
}

//adds number of days to current day of week.
function rawDateofWeek(dayVal){
  var currentDay = findCurrentDayofWeek();
  var numberVar = 0;
  if(currentDay > dayVal){

    numberVar = (7-(currentDay-dayVal));

  }else{
    numberVar = (dayVal - currentDay)
  }
  //find the number of the current day and then find how many days away the day you are looking for is. if today is wednesday, then monday is 5 days away.
  var daysToAdd = numberVar+numDay;
  var nextWeek = moment().add(daysToAdd, 'days');
  return nextWeek;
}

//adds number of days to current day of week.
function dateofWeek(dayVal){
    //if asking for date of week with 0, that means Sunday. Have to find how many days away 0, or sunday is, for example. i need to figure out where dayValue is and add the right number of days.
    var currentDay = findCurrentDayofWeek();
    var numberVar = 0;

    if(currentDay > dayVal){
      numberVar = (7-(currentDay-dayVal));
    }else{
      numberVar = (dayVal - currentDay)
    }
    var daysToAdd = numberVar+numDay;
    var nextWeek = moment().add(daysToAdd, 'days');
    // var traditionalDate = (nextWeek).toString().split(' ').splice(1,3).join(' ');
    // return traditionalDate;
    var m = nextWeek.format("MMM");
    var d = nextWeek.format("Do");
    var y = nextWeek.format("YYYY");
    var myDate= m + ' ' + d + ' ' + y;
    return myDate;
}

//returns name of the week, this is used for the column headers
function nameofWeek(dayVal){
  var currentDay = findCurrentDayofWeek();
  var numberVar = 0;
  if(currentDay > dayVal){
    numberVar = (7-(currentDay-dayVal));
  }else{
    numberVar = (dayVal - currentDay)
  }
  var nextWeek = moment().add(numberVar, 'days');
  var dayName = (nextWeek).format("ddd");
  return dayName;
}

//populates the names of the days at the top of the calendar.
function loadDates(){
  var multiArray = createMultiArray();
  var currentDay = findCurrentDayofWeek(); //get the current day. Find how many days to subract to get to monday.
  //ddd
  for(var i=0; i<multiArray.length; i++){
    document.getElementById(multiArray[i][4].toLowerCase()).innerHTML = nameofWeek(i);
    document.getElementById(multiArray[i][4].toLowerCase()).innerHTML += "<br/>";
    document.getElementById(multiArray[i][4].toLowerCase()).innerHTML += dateofWeek(i);
  }
}

function nextWeek(){
  $('#calendarDays').hide();
  $('#calendarDays').fadeIn(500);
  numDay=numDay+7;
  loadDates();
  initiateCalendar();
}

function previousWeek(){
  $('#calendarDays').hide();
  $('#calendarDays').fadeIn(500);
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
  var m = monthNames[date.format("M")];
  var d = date.format("Do");
  var y = date.format("YYYY");
  var myDate= m + ' ' + d + ' ' + y;
  return myDate;
}

//formats time hours minutes and am/pm
function timeformat(date) {
  var mytime = moment(date).format("LT");
  return mytime;
}

function fillFormDate(bookingDay, bookingDate, bookingTime){
  document.getElementById('bookingDay').innerHTML=bookingDay;
  document.getElementById('bookingDate').innerHTML=bookingDate;
  document.getElementById('bookingTime').innerHTML=bookingTime;
  document.getElementById('bookingDuration').innerHTML=bookingDuration;
}

//removes jobs that maids have already accepted; if multiple maids have that day available, then the user can schedule on that day/time.
function removeScheduledJobs(scheduledJobThreshold){
  var daysArray = createDayArray();
  var multiArray = createMultiArray();
  var dayNumberAvailable = countDaysAvailable(); //shows the number of maids available for each day.
  var dayInfo = "";
  var cellNumber = "";

  //number of maids that have to be available for scheduled job to not matter.
  //FIXME:0 Make it so it figures out if certain jobs shouldnt null out times if their are a lot of maids avialable at that time.

  for(var i=0; i<numberofScheduledJobs; i++){
    //go through each job and get scheduled job details.
    var jobDay = jobDayArray[i]; //array of job days
    var jobDate = jobDateArray[i]; //array of job dates
    var jobTime = jobTimeArray[i]; //array of job times
    var jobDuration = jobDurationArray[i]; //array of durations

    for(var b = 0; b<daysArray.length; b++){
      //find day,
      var selectedDay = multiArray[b][4];

      if(jobDay == selectedDay){

        //see if job is within the current week. See if job is within 7 days of the current date.
        //If a job isnt in the current week, it should be whited out, because we dont know how many employees will be available in the future.
        var todayPlusSeven = moment().add(numberVar, 'days');
        if(jobDate < todayPlusSeven){
          //job is within seven days, check to see how many maids are available on that day.
          var numberMaidsAvailable = dayNumberAvailable[b];
          if(numberMaidsAvailable >= scheduledJobThreshold){
            //enough maids are available to leave the scheduling time open.
            //FIXME:end funtion. Maybe a return statement.
          }
        }

        //get date of the same day of current week.
        selectedDayInfo = rawDateofWeek(b);
        var month = selectedDayInfo.format("MM"); //months from 01-12
        var day = selectedDayInfo.format("DD"); //days 01-31
        var year = selectedDayInfo.format("YYYY"); //year 2017
        var selectedDateFull = year + "-" + month + "-" + day;
        //see if day shares same date as the scheduled job. jobDate format example: 2017-02-26
        if(jobDate == selectedDateFull){
          //The calendar is displaying the day of the job, get day information.
           dayInfo = rawDateofWeek(b);
           divID = multiArray[b][1];
           cellNumber = "cell"+b+"";
           //find correlating cells on calendar and make them unavailable.
           var startIndex = 0;
           var endIndex = 0;
           var cellDurationAddValue = (jobDuration*2);
           var searchElem = document.getElementById(divID).children;

           for(var f = 0; f < searchElem.length; f++) {
             //find cells with matching start time.
             if(searchElem[f].id.indexOf(jobTime) == 3) {
               startIndex = f;
               endIndex = f + cellDurationAddValue;
               //add plus one in order to make the last day unavailable.
               for(var g = startIndex; g < (endIndex + 1); g++){
                   searchElem[g].className = "dayCell "+cellNumber+" unCell";
               }
             }
           }
        }
      }
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
  //make days that have all unavailable cells into unavailable days. If all days are unavailble for the current week show message that whole week is unavailable.
  //get days marked as available
  var daysArray = createDayArray();
  var dayInfo = createMultiArray();

  for(var i=0; i < daysArray.length; i++){
    var dayNumber = daysArray[i];
    var cellName = dayInfo[i][1];
    var dayName = dayInfo[i][2];
    var dayofWeek = dayInfo[i][4];

    if(dayNumber==1){
      //day is available, check to see if it has all unavailable cells and mark them all as uncell.
      var charArray = [];
      var searchElem = document.getElementById(cellName).children;
      for(var x=0; x < searchElem.length; x++){
        var characteristic = searchElem[x].className;
        if(characteristic.includes("unCell")){
          charArray.push(characteristic);
        }
      }
      if(charArray.length == 18){
        //all cells are uncells, remove all the cells and make the whole column unavailable. Maybe add a display non class to the column.
        var myNode = document.getElementById(cellName);
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild);
        }
        $("#"+cellName).append('<div id="'+dayName+'930" class="dayCell unCell cell'+dayNumber+'"><center>'+dayofWeek+' is unavailable.</center></div>');
      }
      else{
      }
    }
  }

  //check for columns marked as unavailable and remove all cells and make the whole day unavailble
  for(var i=0; i < daysArray.length; i++){
      var dayNumber = daysArray[i];
      var dayName = dayInfo[i][2];
      var dayofWeek = dayInfo[i][4];
      var cellName = dayInfo[i][1];
      var myNode = document.getElementById(cellName);
      var characteristic = myNode.className;
      if(characteristic.includes("unavailable")){
        while (myNode.firstChild) {
          myNode.removeChild(myNode.firstChild);
        }
        //creates a cell at the top of the day cells that says this day is unavailable.
        $("#"+cellName).append('<div id="'+dayName+'930" class="dayCell unCell cell'+dayNumber+'"><center>'+dayofWeek+' is unavailable.</center></div>');
      }
    }

    //make whole week unavailable if all days are unavailable.
    var dayCounter = 0;
    for(var i=0; i < daysArray.length; i++){
      var cellName = dayInfo[i][1];
      var myNode = document.getElementById(cellName);
      var characteristic = myNode.className;
      if(characteristic.includes("unavailable")){
        dayCounter++;
      }
      if(dayCounter==7){
      $('#unavailWeek').show();
      $('.dayColumns').hide();
    }
    }
}

function checkdurationException(duration){
  var daysArray = createDayArray();
  var multiArray = createMultiArray();
  var cleanLength = (duration*2);

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

// multiplies the maxout ratio by the number of active maids available in the area.
function calculateCalendarMaxout(maidMaxoutRatio, numberOfMaids){
  var maxoutratio = parseInt(maidMaxoutRatio);
  var numbermaids = parseInt(numberOfMaids);
  var calendarMaxout = Math.floor(maxoutratio*numbermaids);
  return calendarMaxout;
}

function newCleaningOrder(day, jobDate, timeSet, duration, zipCode, totalAmount, fName, lName, street, city, note, custPhone, custEmail) {
    var bookingIDvalue = "";
    if (day === "") {
        //nothing, end function.
        return;
    } else {
        if (window.XMLHttpRequest) {
            // code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {
            // code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                bookingIDvalue = this.responseText;
                //set bookingID into hidden field in Stripe.
                document.getElementById("bookingJobID").value = bookingIDvalue;
            }
        };

        xmlhttp.open("GET","calendarUpdate.php?day="+day+"&jobDate="+jobDate+"&timeSet="+timeSet+"&duration="+duration+"&zipCode="+zipCode+"&totalAmount="+totalAmount+"&fName="+fName+"&lName="+lName+"&street="+street+"&city="+city+"&note="+note+"&custPhone="+custPhone+"&custEmail="+custEmail,true);
        xmlhttp.send();
    }
    //show paypal payment button
    //hide stuff
}

function validateForm()
{
    var day = document.getElementById('bookingDay').innerHTML;
    var dateValue = document.getElementById('bookingDate').innerHTML;
    var jobDate = dateValue.toString();
    var timeSet = document.getElementById('bookingTime').innerHTML;
    var duration = document.getElementById('bookingDuration').innerHTML;
    var zipCode = "80016";
    var totalAmount = 90;
    var bookingNotes = document.getElementById('bookingNotes').value;

    var a=document.getElementById('fName').value;
    var b=document.getElementById('lName').value;
    var c=document.getElementById('emailField').value;
    var d=document.getElementById('cPhone').value;
    var e=document.getElementById('address').value;
    var f=document.getElementById('city').value;
    var g=document.getElementById('zipCode').value;

    if (a==null || a=="" || b==null || b=="" || c==null || c=="" || d==null || d=="" || e==null || e=="" || f==null || f=="" || g==null || g=="")
      {
        //form is not filled out.
      // alert("Please Fill All Required Field");
        $('#fieldwarning').fadeIn(500);
      }
      else{
        //form is filled out.
        newCleaningOrder(day, jobDate, timeSet, duration, f, totalAmount, a, b, e, f, bookingNotes, d, c);
        // fill in stripe order info
        var bookingFname = document.getElementById('fName').value;
        var bookingLname = document.getElementById('lName').value;
        var bookingFullName = ""+ bookingFname +" "+ bookingLname + "";

        document.getElementsByClassName('bookingDay')[0].innerHTML = document.getElementById('bookingDay').innerHTML;
        document.getElementsByClassName('bookingDate')[0].innerHTML = document.getElementById('bookingDate').innerHTML;
        document.getElementsByClassName('bookingTime')[0].innerHTML = document.getElementById('bookingTime').innerHTML;

        document.getElementsByClassName('bookingFullName')[0].innerHTML = bookingFullName;
        document.getElementsByClassName('bookingStreet')[0].innerHTML = document.getElementById('address').value;
        document.getElementsByClassName('bookingCity')[0].innerHTML = document.getElementById('city').value;
        document.getElementsByClassName('bookingZip')[0].innerHTML = document.getElementById('zipCode').value;

        $('#bookingForm').hide();
        $('#stripeDiv').fadeIn(1200);
      }
}

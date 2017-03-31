<?php
//At checkout customer chooses how they want to be notified, phonecall + email, text message + email, or just email. This is because some customers dont use texting.
//however, even if they dont, they can use the website customer support center..
//improvement Notes:
//When a cleaning is going to be accepted should check dates to make sure it isnt a cleaning in the past.
//Need a fee function for cancelations: INSERT FEE FUNCTION
//insert values into some of the reply messages, Customer cancellation/accepting new jobs.
//Maybe check the JobID number string, to make sure they arn't sql injecting.
require_once 'login/dbconnect.php';
//Twilio REST API
require __DIR__ . 'vendor/autoload.php';
use Twilio\Rest\Client;
// TWILIO Your Account SID and Auth Token from twilio.com/console
$sid = 'KEY HERE';KEY HERE
$token = 'KEY HERE';
$client = new Client($sid, $token);
//Receive inbound text message Information
$messageID = $_REQUEST['MessageSid']; //unique message id, can use to retreive the message later
$accountNumber = $_REQUEST['AccountSid']; //hygeia account number
$serviceSid = $_REQUEST['MessagingServiceSid']; //identifies service associated with message
$smsFrom = $_REQUEST['From']; //maid/customer number
$smsTo =  $_REQUEST['To']; //me number
$smsBody = $_REQUEST['Body']; //message receieved, up to 1600 characters long.
$smsBody = strtolower($smsBody);
//customers response / JobID+accept
$noclean = "noclean"; //customers response to cancel house cleaning
$yesclean = "yesclean"; //customer accepts clean, this can be used for notifying customer of future cleaning.
$nocancel = "nocancel"; // deny cancel
$yescancel = "yescancel"; //confirm cancel
//maids response / jobID+yes
$yescleaning = "yescleaning"; //maids response to accept a cleaning
$nocleaning = "nocleaning"; //maids response to cancel a cleaning
$acceptnew = "acceptnew"; //this means the maid wants to accept a new cleaning job that has recently become available
$delaythirty = "delaythirty"; //expirimental, not important.
//system automatically sends a text to the maid/customer at the time of cleaning.
//maid accepts and cleaner accepts.
$noshow = "noshow"; //maid did not arrive within 20 minutes of cleaning time.
$nocustomer = "nocustomer"; //maids response that customer is not home, need some way to verify this.
$confirmarrival = "confirmarrival"; //confirm that the maid has arrived.
//maids response to cancel a cleaning
//if reply is noclean, then cancel the cleaning
//search for associated phone number, customer or maid.
//use reply saying for cancelling cleaning - noclean / yesclean
// maids will say:
//First. Determine if maid or customer replying, by searching for phone number.
//phone numbers have to be unique for maids and house cleaners.
//if reply is accept than accept the cleaning.
//function to send text message
function sendTextMessage($client, $smsMessage, $smsFrom){
     $client->messages->create(
        // the number you'd like to send the message to
        $smsFrom,
        array(
            // A Twilio phone number you purchased at twilio.com/console
            'from' => '+17205731908',
            // the body of the text message you'd like to send
            'body' => $smsMessage
        )
    );
}
//remove quotations from smsBody
// //example
// $smsFrom = "+17208080236";
// $smsBody = "193ACCEPT";
//split reply into jobID and answer
$smsInboundDecision = $smsBody;
$arr = preg_split('/(?<=[0-9])(?=[a-z]+)/i',$smsInboundDecision);
$jobID = $arr[0];
$smsDecision = $arr[1];
if($smsDecision == "accept" || $smsDecision == "cancel" || $smsDecision == "no" || $smsDecision == "yes"){
    //normal, proceed.
}else {
    //UserErrorTxt1: the user typed in the incorrect phrase. Tell user.
    $smsMessage ="ErrTxt1: Unknown response, please retype your message.";
    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
}
//testing VALUES
print_r($arr);
echo $arr[0];
echo $arr[1];
echo $smsBody;
echo $smsTo;
echo $smsFrom;
print "hello";
// check inbound phone number exists in customer table or not.
$result = mysql_query("SELECT * FROM customers WHERE custPhone='$smsFrom'") or die(mysql_error());
$count = mysql_num_rows($result); //if email not found then proceed
if ($count==0)
{
//The user is not a customer
    //check if user is a maid
    //check phone number exists or not in maid table
    $resultMaid = mysql_query("SELECT * FROM users WHERE mPhone='$smsFrom'") or die(mysql_error());
    $countMaid = mysql_num_rows($resultMaid); //if email not found then proceed
    if($countMaid==1)
    {
        //user is a maid, get maid's email or Guid
        $resultMaidArray=mysql_fetch_array($resultMaid);
        $mEmail = $resultMaidArray['userEmail'];
        $maidFname = $resultMaidArray['mFname'];
        $maidLname = $resultMaidArray['mLname'];
        $maidGuid = $resultMaidArray['userGuid'];
        //find the specific job in the datatable
        $maidQueryJob = mysql_query("SELECT * FROM job_post WHERE jobID='$jobID'") or die(mysql_error());
        if($smsDecision == "yes")
        {
            //maid wants to accept a cleaning, update table and send response
            //look for cleaning with jobID and maid's phone number
            if($maidQueryJobArray=mysql_fetch_array($maidQueryJob))
            {
                $acceptedValue = $maidQueryJobArray['status']; //see if the cleaning has been accepted
                if($acceptedValue == 1)
                {
                    //the cleaning is already accepted, send text reply that it has already been accepted.
                    $smsMessage = "You have already accepted this cleaning.";
                    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
                }else
                if($acceptedValue == 0)
                {
                    //Cleaning not previously accepted, mark the cleaning as accepted by the maid.
                    $markAccepted = mysql_query("UPDATE job_post SET status='1',userID='$mEmail' WHERE userID='$mEmail' AND jobID='$jobID'") or die(mysql_error());
                    //send text message response that the cleaning has been accepted and that their is a fee if they decide to cancel within 5 days of cleaning date.
                    $smsMessage= "Congrats! You have accepted this cleaning. Please be aware their is a possible fee if you decide to cancel.";
                    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
                }
            }
        }else
        if($smsDecision == "no")
        {
            //maid wants to cancel cleaning.
            //there is a fee for cancellation.
            //maid wants to cancel a cleaning. Give customer extra money. Give customer most of the cleaning fee.
            $maidQueryAcceptedJob = mysql_query("SELECT * FROM job_post WHERE userID='$mEmail' AND jobID='$jobID'") or die(mysql_error());
            $countMaid = mysql_num_rows($maidQueryAcceptedJob); //count to see if any jobs come up.
            if($maidQueryJobArray=mysql_fetch_array($maidQueryAcceptedJob))
            {
                $acceptedValue = $maidQueryJobArray['status']; //see if the cleaning has been accepted
                if($acceptedValue == 1)
                {
                    //The Cleaning has been accepted in the past by this maid and can be cancelled.
                    //Store response in datatable.
                    $markAccepted = mysql_query("UPDATE job_post SET status='0' WHERE userID='$mEmail' AND jobID='$jobID'") or die(mysql_error());
                    //put a 10% fee on the maids account.
                    $smsMessage = "The house cleaning has been cancelled. Please check your account to view appropriate fees."; //what is fee amount?
                    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
                }else
                if($acceptedValue == 0)
                {
                    //The Cleaning can not be cancelled. Because it has not been accepted yet.
                    $messageSMS = "You have not accepted this cleaning yet, so it cannot be cancelled.";
                    $sendMessageGo = sendTextMessage($client, $messageSMS, $smsFrom);
                }else{
                    //should submit fixing request.
                    $messageSMS = "errorTxtM1: Error occured, please use maid dashboard.";
                    $sendMessageGo = sendTextMessage($client, $messageSMS, $smsFrom);
                }
            }
            //look in job_post for a job corrisponding to the maid's email/user guid and the date of the cleaning.
            //
            //Send text/email response to maid that the cleaning has been cancelled.
        }else{
            //text is unrelated to accepting or rejecting a cleaning.
            //maybe see what it is about or ask them to retry.
            $smsMessage = "errorTxtM2: Unknown reponse, please retype your message.";
            $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
        }
    }else
    if($countMaid==0)
    {
        //maid is not found. Please use website. Error
        $smsMessage = "errorTxtM4: An error has occured, please use the online maid dashboard.";
        $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
    } else
    {
    //multiple entries for same phone number for some reason, have maid confirm/cancel cleaning through web application
        // check if this job has already been submitted for fixing
        $queryRepair = mysql_query("SELECT * FROM repaircenter WHERE jobID='$jobID'") or die(mysql_error());
        $countMaid = mysql_num_rows($queryRepair); //count to see if any jobs come up.
        if($countMaid==0){
            $resultMaidArray=mysql_fetch_array($resultMaid);
            $maidFname = $resultMaidArray['mFname'];
            $maidLname = $resultMaidArray['mLname'];
            $mEmail = $resultMaidArray['userEmail'];
            $repairDescription = "There are more than one maids with the same phone number.errorTxtM3";
            //hasn't been submitted for fixing, submit it.
            $storeProblem=mysql_query("INSERT INTO `repaircenter`(`jobID`, `maidFname`, `maidLname`,`maidEmail`, `Description`) VALUES ('$jobID','$maidFname','$maidLname','$mEmail','$repairDescription')") or die(mysql_error());
            //maybe email team so that they fix this maid contact information because there is duplicates for some reason. Store job ID in a "fix" section.
        }else{
            //fix request has already been submitted. Do nothing
        }
        $smsMessage = "errorTxtM3: An error has occured, please use the online maid dashboard.";
        $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
    }
}
else if($count==1)
{
    //user is a customer,
    //get customer information
    $resultCustomer = mysql_query("SELECT * FROM customers WHERE custPhone='$smsFrom'") or die(mysql_error());
    $countCustomer = mysql_num_rows($resultCustomer); //if email not found then proceed
    $customerInfoArray=mysql_fetch_array($resultCustomer);
    $custEmail = $customerInfoArray['custEmail'];
    $custFname = $customerInfoArray['custFname'];
    $custLname = $customerInfoArray['custLname'];
    $custGuid = $customerInfoArray['custGuid'];
    //Check if they accepted or cancelled a cleaning.
    if($smsDecision=="accept")
    {
        //customer accepts cleaning request
        //check to see if job exists, if not, insert new cleaning job into database.
        //look for cleaning with jobID and cust's email number
        $customerQueryJob = mysql_query("SELECT * FROM job_post WHERE custEmail='$custEmail' AND jobID='$jobID' AND customerCancel='1'") or die(mysql_error());
        $countJob = mysql_num_rows($customerQueryJob); //if email not found then proceed
        if($countJob==1){
            //CUSTOMER cancelled this cleaning in the past.
            //mark that the customer accepts this cleaning that has already been created.
            //undo customer cancellation.
            //Make sure the cleaning hasn't occured, compare job date with now to make sure that the job hasn't already happened.
            $customerCancelledJobArray=mysql_fetch_array($customerQueryJob);
            $jobDate = $customerCancelledJobArray['jobDate'];
            $completed = $customerCancelledJobArray['completed'];
            $jobDay = $customerCancelledJobArray['day'];
            $timeSet = $customerCancelledJobArray['timeSet'];
            //$nowDate = new DateTime();
            if($completed = 0){
                //job can be accepted, job not marked as completed.
                $undoCustomerCancellation = mysql_query("UPDATE job_post SET status='0', customerCancel='0' WHERE custEmail='$custEmail' AND jobID='$jobID'") or die(mysql_error());
                $smsMessage = "Hooray! Your cleaning is scheduled for date and time."; //insert correct day, time, and date.
                $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
            }else if($completed= 1){
                //job cannot be accepted, it has already been marked as completed.
                $smsMessage = "	errTxtC1: Error has occured, please use the website to schedule a cleaning: www.HygeiaMaid.com. Thank you.";
                $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
            }else{
                $description = "For some reason this cleaning is not marked as completed = 0 or completed = 1.";
                //Fix request.
                $smsMessage = "	errTxtC2: Error has occured, please use the website to schedule a cleaning: www.HygeiaMaid.com. Thank you.";
                $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
            }
        }else if($countJob>1){
            //MOre than one job found that the customer cancelled with same jobID, this would almost never happen.
            //fix request, almost too rare though.
            $smsMessage = "	errTxtC3: Error has occured. Please use website to schedule a cleaning: www.HygeiaMaid.com. Thank you.";
            $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
        }
        else{
            //No job found. Put customers information in a new job. Cleaning job should be created before customer accepts.
            $custQueryNewJobAccept = mysql_query("UPDATE job_post SET fullName='$custLname', custEmail='$custEmail' WHERE jobID='$jobID'") or die(mysql_error());
            //fetch job data for text message.
            $customerQueryNewJob = mysql_query("SELECT * FROM job_post WHERE jobID='$jobID'") or die(mysql_error());
            $customerArrayNewJob=mysql_fetch_array($customerQueryNewJob);
            $jobDate = $customerArrayNewJob['jobDate'];
            $jobDay = $customerArrayNewJob['day'];
            $timeSet = $customerArrayNewJob['timeSet'];
            //get job information from ID and update statis with customer information.
            $smsMessage = "Hooray! Your cleaning is scheduled for date and time."; //insert job date, time, and day.
            $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
        }
    }else
    if($smsDecision=="cancel")
    {
    //customer wants to cancel the cleaning, charge them a fee...figure out fee payment based on time, maid acceptance, and price.
        //look for cleaning with jobID and cust's email number
        $customerQueryJob = mysql_query("SELECT * FROM job_post WHERE custEmail='$custEmail' AND jobID='$jobID'") or die(mysql_error());
        //insert a cancellation in pg_last_notice
        //check to make sure it isn't already cancelled.
        $customerCancellationArray=mysql_fetch_array($customerQueryJob);
        $maidCancel = $customerCancellationArray['$maidCancel'];
        $customerCancel = $customerCancellationArray['$customerCancel'];
        if($maidCancel ==1 || $customerCancel==1 )
        {
            //customer or maid has already cancelled this cleaning.
            $smsMessage = "This cleaning has already been cancelled.";
            $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
        }
        else
        {
            //The cleaning has not been cancelled in the past, see if the cleaning has been accepted.
            if($custQueryJobArray=mysql_fetch_array($customerQueryJob))
            {
                $statusValue = $custQueryJobArray['status']; //see if the cleaning has been accepted
                if($statusValue == 1)
                {
                    //The cleaning has been accepted by a maid, so cancel it.
                    //Store response in datatable. Cancel Status and customerCancel
                    $markCustCancelledOne = mysql_query("UPDATE job_post SET status='0', customerCancel='1' WHERE custEmail='$custEmail' AND jobID='$jobID'") or die(mysql_error());
                    //INSERT FEE FUNCTION
                    //Charge the customer a fee.
                    //Insert function for customerfee table.
                    //Tell customer and maid that the house cleaning has been cancelled.
                    $smsMessage = "Your house cleaning has been cancelled. You have been refunded: Amount. If you want to undo your cancellation, then simply reply jobID+accept/cancel."; //figure out how much customer is refunded/reply option.
                    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
                }else
                if($statusValue == 0)
                {
                    //This cleaning has not been accepted by a maid yet. Cancel it
                    //Store response in datatable.
                    $markCustCancelledTwo = mysql_query("UPDATE job_post SET customerCancel='1' WHERE custEmail='$custEmail' AND jobID='$jobID'") or die(mysql_error());
                    //INSERT FEE FUNCTION
                    //Send message to the customer that the cleaning has been cancelled. Give them the option to uncancel or reschedule.
                    $textReply = "Your house cleaning has been cancelled. Fee statement. If you want to undo your cancellation, then simply reply jobID+accept/cancel.";  //Tell customer how much they have been refunded/reply option.
                    $sendMessageGo = sendTextMessage($client, $textReply, $smsFrom);
                }
            }
        }
    }
}else
if($count > 1){
    //more than one entry for this customer in the database.
    //submit fix request, tell customer to contact customer support.
    $customerInfoArray=mysql_fetch_array($result);
    $custEmail = $customerInfoArray['custEmail'];
    $custFname = $customerInfoArray['custFname'];
    $custLname = $customerInfoArray['custLname'];
    $custGuid = $customerInfoArray['custGuid'];
    $repairDescription = "There are more than one customer with the same phone number.errTxtC4.";
    //hasn't been submitted for fixing, submit it.
    $storeProblem = mysql_query("INSERT INTO `repaircenter`(`jobID`, `maidFname`, `maidLname`,`maidEmail`, `Description`) VALUES ('$jobID','$custFname','$custLname','$custEmail','$repairDescription')") or die(mysql_error());
    //maybe email team so that they fix this maid contact information because there is duplicates for some reason. Store job ID in a "fix" section.
    //error message
    $smsMessage = "	errTxtC4: Error has occured. Please use our website for your request: www.HygeiaMaid.com. Thank you.";
    $sendMessageGo = sendTextMessage($client, $smsMessage, $smsFrom);
}
else
{
//something went wrong, no idea what went wrong.
//have them make changes on the website.
    $errTyp = "	errTxtR1: Error occured, please retype your response or use the website for support: www.HygeiaMaid.com. Thank you.";
    $sendMessageGo = sendTextMessage($client, $errTyp, $smsFrom);
}
//Fee insert some type of time calculation, so that if a customer orders a last minute clean right away and cancels before anyone accepts, it is not super expensive for them.
//CUSTOMER fee function, 5% if not accepted, 10% if accepted. Based on Time.
//percent changes 2 weeks duration. 10% divided by 14 days .70 each day.
//clean date minus cleaning order date equals days til clean, take 14 minus days till clean and multiply by .70.
//at 13 days cost is .7 percent of purchase price.
//if less than 1 week,
//step one: see if cleaning is accepted. 5% not accepted / 10% accepted. Pay maid 5% if accepted.
//step two: get celaning price, order date, and cleaning date.
//step three: get
//MAID fee function.
//Maybe based on time, or the number of cleans, fee is based on maid rating/performance.
//5% plus, rating score average. 5%
//maybe give customers the option to view cleanings that they have scheduled and maybe schedule more through their phone.
//Send them an email if they want to confirm another cleaning order.
//reciving Twilio texts
//https://www.twilio.com/docs/api/twiml/sms/twilio_request
//https://www.twilio.com/docs/quickstart/php/sms/replying-to-sms-messages
//http://stackoverflow.com/questions/30623690/receiving-sms-and-storing-it-in-database-using-twilio
// $_REQUEST['MessageSid'] - A 34 character unique identifier for the message. May be used to later retrieve this message from the REST API.
// $_REQUEST['SmsSid'] - Same value as MessageSid. Deprecated and included for backward compatibility.
// $_REQUEST['AccountSid'] - The 34 character id of the Account this message is associated with.
// $_REQUEST['From'] - The phone number that sent this message.
// $_REQUEST['To'] - The phone number of the recipient.
// $_REQUEST['Body'] - The text body of the message. Up to 1600 characters long.
// $_REQUEST['NumMedia'] - The number of media items associated with your message
?>


import requests
import json
from datetime import datetime, timedelta
import smtplib
import ssl
import os
import time
import random


campaignName = 'Pune restaurants Campaign'
fileName = 'pune-data.json'    # data of customers
maxCount = 300            # after how many message software should close ?
howManyRounds = 9
deleteMsg = False          # True or False
startsFrom = 0
generateOnlyReport = False
breathOn = 100  # message
breatheFor = 8  # minutes
sendOnlyText = False
stdCode = '91'


message = '''
🍔📱 Get your own branded food delivery app on the Play Store for just 9980* INR 
🚀 Boost your business with our app that helps you receive orders.
📈 Visit our website for more info. Let's chat! 

Your Ankit Tirkey  👋 

https://silverfoil.web.app/

'''
count = 0

ENDPOINT = 'http://localhost:8000'


def starter_login():
    port = 465  # For starttls
    smtp_server = "smtp.gmail.com"
    verifier_address = "salesmafiaonline@gmail.com"
    receiver_emails = 'azamnotneta@gmail.com'
    password = 'tlssoshfpoucgjzp'
    message = 'From: {}\nSubject: {}\n\n{}'.format(
        'Campaign Starter', 'Verified and started', 'Campaign '+campaignName + 'has been started by '+os.getlogin() + ' at ' + str(datetime.now().strftime("%d/%m/%Y %H:%M:%S")))
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(smtp_server, port, context=context) as server:
        server.login(verifier_address, password)
        server.sendmail(verifier_address, receiver_emails, message)
        print('------------------- VERIFIED & STARTED ---------------->')
        return 1


starter_login()


def updateJsonFile(number, details):
    # Open the JSON file for reading
    jsonFile = open(fileName, "r", encoding="utf8")
    data = json.load(jsonFile)  # Read the JSON into the buffer
    jsonFile.close()  # Close the JSON file
    # Working with buffered content
    data[number] = details
    # Save our changes to JSON file
    jsonFile = open(fileName, "w+")
    jsonFile.write(json.dumps(data))
    jsonFile.close()


# Opening JSON file
f = open(fileName, encoding="utf8")

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()
data = json.load(f)


# TODO: count in json file to read, integrate message delete api

file = open(campaignName+'.txt', 'a')  # Open a file in append mode
file.write('\nCampaign "'+campaignName + '" has been started at ' +
           str(datetime.now().strftime("%d/%m/%Y %H:%M:%S")) +
           '\n===========================viralaonla=================================\n\n')
file.close()  # Close the file

lastTimeFalseReport = str(
    datetime.now().strftime("%d/%m/%Y %H:%M:%S"))


def get_next_random_seconds(date_string):
    # Convert date_string to datetime object
    date_obj = datetime.strptime(date_string, '%d/%m/%Y %H:%M:%S')
    # Add 10 seconds to the datetime object
    next_10_seconds = date_obj + timedelta(seconds=random.randint(10, 16)
                                           )
    # Convert the next_10_seconds object back to string format
    next_10_seconds_str = datetime.strftime(
        next_10_seconds, '%d/%m/%Y %H:%M:%S')
    # Return the next_10_seconds string
    return next_10_seconds_str


for index, (ph_number, element) in enumerate(data.items()):
    if index >= startsFrom:
        if count == maxCount:
            print("Message package limit reached, closing the session!")
            file = open(campaignName+'.txt', 'a')  # Open a file in append mode
            file.write(
                '\n\nMessage package limit reached, closing the session! Sent ->' + str(count))
            file.close()  # Close the file
            break
        else:
            number = str(ph_number)
            data_of_reciever = element
            if "sent_cycle" not in data_of_reciever or data_of_reciever["sent_cycle"] < howManyRounds:
                payload = {
                    'number': stdCode+number[-10:],
                }
                if sendOnlyText:
                    payload['message'] = message
                else:
                    payload['caption'] = message
                try:
                    res = None
                    if generateOnlyReport == False:
                        response = session.post(ENDPOINT+('/send-message' if sendOnlyText else '/send-media'),
                                                headers=headers, data=payload)
                        res = json.loads(response.text)
                        data_of_reciever["sent_cycle"] = howManyRounds
                    # Open a file in append mode
                    file = open(campaignName+'.txt', 'a')
                    timeString = str(
                        datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

                    if generateOnlyReport:
                        # lastTimeFalseReport = timeString
                        timeString = get_next_random_seconds(
                            lastTimeFalseReport)

                    file.write(
                        '('+str(count+1)+') '+str(number[:5])+'****'+str(number[-4:]) + ' at ' + timeString + '\n')
                    file.close()  # Close the file
                    lastTimeFalseReport = timeString
                    data_of_reciever["message"] = "Message sent" if res and res["status"] == True else "Number not on whatsApp"
                    updateJsonFile(number, data_of_reciever)
                    print(number[-10:] + " :: " + ("Message sent" if res and res["status"]
                                                   == True else "Number not on whatsApp"))
                    count += 1
                    if res["status"] == True and generateOnlyReport == False:
                        if index % breathOn == 0:
                            time.sleep(breatheFor * 60)
                            print('Breathing---')
                        time.sleep(random.randint(4, 15))
                        if deleteMsg:
                            response = session.post(ENDPOINT+'/delete-chat',
                                                    headers=headers, data={'number': stdCode+number[-10:]})
                            time.sleep(random.randint(3, 12))
                    elif res:
                        file = open(campaignName+'_not_on_whatsapp.txt', 'a')
                        file.write(
                            '('+str(count+1)+') '+str(number) + ' :: ' + str(data_of_reciever["Name"] if 'Name' in data_of_reciever else '')+'\n')
                        file.close()  # Close the file
                except Exception as e:
                    print(e)
                    pass

# Closing file
f.close()
print(str(count) + " messages sent ./")

import requests
import json
import time


def updateJsonFile(number, details):
    jsonFile = open("nps_sent.json", "r")  # Open the JSON file for reading
    data = json.load(jsonFile)  # Read the JSON into the buffer
    jsonFile.close()  # Close the JSON file
    # Working with buffered content
    data[number] = details
    # Save our changes to JSON file
    jsonFile = open("nps_sent.json", "w+")
    jsonFile.write(json.dumps(data))
    jsonFile.close()


# Opening JSON file
f = open('nps_data.json')
sent = open('nps_sent.json')

message = '''
आपको सूचित किया जाता है कि विद्यालय में छात्रवृत्ति फार्म भरने की अंतिम तिथि *30 सितंबर* है। कृपया देर न करें, इसे अंतिम तिथि से पहले भरें।
*यदि पहले ही भर चुके हैं, तो कृपया ध्यान न दें।*

आवश्यक दस्तावेज़ :
1. [2] पासपोर्ट साइज फोटो (छात्र)
2. आईडी कार्ड (छात्र)
3. फीस कार्ड
4. आधार (छात्र)
5. अंतिम कक्षा का रिपोर्ट कार्ड
6. आय प्रमाण पत्र (पिता)
7. बैंक पासबुक (माता-पिता/छात्र)

प्रधानाचार्य,
*नाज़ पब्लिक स्कूल, आंवला*
शिक्षित व्यक्ति की पहचान, समाज में मिले सम्मान।
9917494671
9219088318
  '''

headers = {'User-Agent': 'Mozilla/5.0'}
session = requests.Session()
data = json.load(f)
count = 0

for element in data:
    # print(element)
    number = str(element["Column4"])
    name = element["Column3"]
    if number not in sent:
        payload = {
            'number': '+91' + number,
            'message': message.replace('#', name + ',')
        }
        # print(payload)
        session.post('http://localhost:8000/send-message',
                     headers=headers, data=payload)
        updateJsonFile(number, {"name": name})
        print("Message sent to :: "+number+" :: " + name)
        count += 1
        time.sleep(15)

# Closing file
f.close()
print(count + "messages sent ./")

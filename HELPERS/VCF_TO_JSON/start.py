import json
import re

contacts = {}
with open('contacts.vcf', 'r') as f:
    current_contact = {}
    for line in f:
        if line.startswith('FN:'):
            print(line[3:].strip())
            current_contact['Name'] = line[3:].strip()
        elif line.startswith('TEL;'):
            number = '+'+re.sub('[^0-9]', '', line[4:])[:12]
            print(number)
            current_contact['Phone'] = number
            contacts[number] = current_contact
            current_contact = {}

with open('contacts.json', 'w') as f:
    json.dump(contacts, f)

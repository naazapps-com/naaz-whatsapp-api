import pandas as pd
import re
import json

outputFileName = 'bangalore-data'

# read csv file
df = pd.read_csv('Restaurants - bangalore.csv')

# extract phone numbers using regex
phone_numbers = []
names = []
addresses = []
for num,num2, name, address in zip(df['Number'],df['Number2'], df['Name'], df['Address']):
    print(num)
    if pd.notna(num):
        print(num, '----------->')
        phone_numbers.append(int(num))
    else:
        phone_numbers.append(num2)
    names.append(name)
    addresses.append(address)

# append phone numbers to json file
with open(outputFileName+'.json', 'w') as f:
    data = {}
    for num, name, address in zip(phone_numbers, names, addresses):
        phone_num = str(num)
        data[phone_num] = {"Phone": phone_num,
                           "Name": name, "Address": address}
    json.dump(data, f, indent=4)

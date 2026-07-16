import csv
import os

CERT_DIR = 'cert_raw_data'
OUT_DIR = 'data'

def find_csv(filename):
    for root, dirs, files in os.walk(CERT_DIR):
        if filename in files:
            return os.path.join(root, filename)
    return None

def parse_logons():
    print("Parsing logons...")
    in_file = find_csv('logon.csv')
    if not in_file:
        print("logon.csv not found")
        return
    
    out_file = os.path.join(OUT_DIR, 'logins.csv')
    
    pending_logons = {}
    
    with open(in_file, 'r', encoding='utf-8') as fin, \
         open(out_file, 'w', encoding='utf-8', newline='') as fout:
        
        reader = csv.DictReader(fin)
        writer = csv.writer(fout)
        writer.writerow(['user', 'login', 'logout'])
        
        count = 0
        for row in reader:
            user = row['user']
            pc = row['pc']
            activity = row['activity']
            date_str = row['date']
            
            key = (user, pc)
            if activity == 'Logon':
                pending_logons[key] = date_str
            elif activity == 'Logoff':
                if key in pending_logons:
                    login_time = pending_logons.pop(key)
                    writer.writerow([user, login_time, date_str])
                    count += 1
                    
            if count % 100000 == 0 and count > 0:
                print(f"Parsed {count} logon sessions...")

def parse_files():
    print("Parsing files...")
    in_file = find_csv('file.csv')
    if not in_file:
        print("file.csv not found")
        return
        
    out_file = os.path.join(OUT_DIR, 'file_access.csv')
    
    with open(in_file, 'r', encoding='utf-8') as fin, \
         open(out_file, 'w', encoding='utf-8', newline='') as fout:
        
        reader = csv.DictReader(fin)
        writer = csv.writer(fout)
        writer.writerow(['user', 'file', 'access_time'])
        
        count = 0
        for row in reader:
            user = row['user']
            date_str = row['date']
            filename = row['filename']
            writer.writerow([user, filename, date_str])
            count += 1
            if count % 100000 == 0 and count > 0:
                print(f"Parsed {count} file access events...")

def parse_usb():
    print("Parsing USB/devices...")
    in_file = find_csv('device.csv')
    if not in_file:
        print("device.csv not found")
        return
        
    out_file = os.path.join(OUT_DIR, 'usb_usage.csv')
    
    pending_connects = {}
    
    with open(in_file, 'r', encoding='utf-8') as fin, \
         open(out_file, 'w', encoding='utf-8', newline='') as fout:
        
        reader = csv.DictReader(fin)
        writer = csv.writer(fout)
        writer.writerow(['user', 'device', 'plug_time', 'unplug_time'])
        
        count = 0
        for row in reader:
            user = row['user']
            pc = row['pc']
            activity = row['activity']
            date_str = row['date']
            
            key = (user, pc)
            if activity == 'Connect':
                pending_connects[key] = date_str
            elif activity == 'Disconnect':
                if key in pending_connects:
                    plug_time = pending_connects.pop(key)
                    device_name = f"{pc}_USB"
                    writer.writerow([user, device_name, plug_time, date_str])
                    count += 1
                    
            if count % 100000 == 0 and count > 0:
                print(f"Parsed {count} usb sessions...")

def parse_emails():
    print("Parsing emails...")
    in_file = find_csv('email.csv')
    if not in_file:
        print("email.csv not found")
        return
        
    out_file = os.path.join(OUT_DIR, 'emails.csv')
    
    with open(in_file, 'r', encoding='utf-8') as fin, \
         open(out_file, 'w', encoding='utf-8', newline='') as fout:
        
        reader = csv.DictReader(fin)
        writer = csv.writer(fout)
        writer.writerow(['sender', 'recipient', 'time', 'subject'])
        
        count = 0
        for row in reader:
            sender = row['from']
            to_field = row['to']
            date_str = row['date']
            content = row['content']
            subject = ' '.join(content.split()[:10]) if content else ""
            
            if to_field:
                for recipient in to_field.split(';'):
                    recipient = recipient.strip()
                    if recipient:
                        writer.writerow([sender, recipient, date_str, subject])
                        count += 1
                        
            if count % 100000 == 0 and count > 0:
                print(f"Parsed {count} email events...")

if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    parse_logons()
    parse_files()
    parse_usb()
    parse_emails()
    print("Done parsing CERT dataset.")

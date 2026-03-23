import os
from pymongo import MongoClient
from pymongo.server_api import ServerApi

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://mongo:27017/miappdb")

client = MongoClient(MONGODB_URI, server_api=ServerApi("1"))
db = client.get_database()  

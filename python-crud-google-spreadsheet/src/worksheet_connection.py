"""Helper Functions for authentication and connection to the Google Sheet"""
import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials


def get_sheet():
    """Loads credentials and uses them to return an instance of a Google Sheet"""
    credentials = ServiceAccountCredentials.from_json_keyfile_name(
        '/code/credentials.json', os.environ['SCOPES'])

    google_credentials = gspread.authorize(credentials)
    sheet = google_credentials.open_by_key(os.environ['SPREADSHEET_ID'])
    return sheet.worksheet('Sheet1')

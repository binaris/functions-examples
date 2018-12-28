import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os


def handler(body, req):
    credentials = ServiceAccountCredentials.from_json_keyfile_name(
            '/code/credentials.json', os.environ['SCOPES'])

    gc = gspread.authorize(credentials)
    sheet = gc.open_by_key(os.environ['SPREADSHEET_ID'])
    ws = sheet.worksheet('Sheet1')

    if (req.query is not None and req.query['key'] is not None):
        return ws.row_values(req.query['key'])
    else:
        return ws.get_all_values()

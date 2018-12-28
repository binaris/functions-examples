import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os


def handler(body, req):
    if (body is None or body['values'] is None or
            type(body['values']) is not list):
        raise Exception('Invalid request body.')
    if (req.query is None or req.query['key'] is None):
        raise Exception('Invalid request: missing query params.')

    credentials = ServiceAccountCredentials.from_json_keyfile_name(
            '/code/credentials.json', os.environ['SCOPES'])

    gc = gspread.authorize(credentials)
    sheet = gc.open_by_key(os.environ['SPREADSHEET_ID'])
    ws = sheet.worksheet('Sheet1')

    ws.insert_row(body['values'], req.query['key'])
    return 'Row written successfully!'

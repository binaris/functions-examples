import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os


def handler(body, req):
    if (body is None or body['key'] is None or body['object'] is None):
        raise Exception('Invalid request body.')
    if (req.query is not None and req.query['key'] is not None):
        raise Exception('Invalid request: missing query params.')

    credentials = ServiceAccountCredentials.from_json_keyfile_name(
            '/code/credentials.json', os.environ['SCOPES'])

    gc = gspread.authorize(credentials)
    sheet = gc.open_by_key(os.environ['SPREADSHEET_ID'])
    ws = sheet.worksheet('Sheet1')

    row = ws.row_values(req.query['key'])
    if (row is None):
        raise Exception('Row number %d ineligible for deletion.'
                        % (req.query['key']))
    else:
        ws.delete_row(req.query['key'])
    return 'Row %d deleted successfully!' % (req.query['key'])

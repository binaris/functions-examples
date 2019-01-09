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


def create(body, req):
    """Handles requests and creates an entry in the Google Sheet"""
    if body is None or body['row'] is None or not isinstance(body['row'], list):
        raise Exception('Invalid request body.')

    worksheet = get_sheet()
    worksheet.append_row(body['row'])
    return 'Row written successfully!'


def read(body, req):
    """Reads a row at index `row_number` from the Google Sheet"""
    if req.query is None or req.query['row_number'] is None:
        raise Exception('Invalid request: missing query params.')
    row_number = int(req.query['row_number'])

    worksheet = get_sheet()
    if req.query is not None and req.query['row_number'] is not None:
        return worksheet.row_values(row_number)
    return worksheet.get_all_values()


def update(body, req):
    """Inserts a row at index `row_number` in the Google Sheet, overwriting any existing row."""
    if body is None or body['row'] is None or not isinstance(body['row'], list):
        raise Exception('Invalid request body.')
    if req.query is None or req.query['row_number'] is None:
        raise Exception('Invalid request: missing query params.')
    row_number = int(req.query['row_number'])

    worksheet = get_sheet()
    worksheet.delete_row(row_number)
    worksheet.insert_row(body['row'], row_number)
    return 'Row {} updated successfully!'.format(row_number)


def delete(body, req):
    """Handles reqests and performs the delete on the Google Sheet"""
    if req.query is not None or req.query['row_number'] is None:
        raise Exception('Invalid request: missing query params.')
    row_number = int(req.query['row_number'])

    worksheet = get_sheet()
    row = worksheet.row_values(row_number)
    if row is None:
        raise Exception('Row number {} ineligible for deletion.'.format(row_number))
    else:
        worksheet.delete_row(row_number)
    return 'Row {} deleted successfully!'.format(row_number)

"""Provies a method for creating a new row entry in a Google Sheet"""
from worksheet_connection import get_sheet

def handler(body):
    """Handles requests and creates an entry in the Google Sheet"""
    if (body is None or body['values'] is None or
            not isinstance(body['values'], list)):
        raise Exception('Invalid request body.')

    worksheet = get_sheet()
    worksheet.append_row(body['values'])
    return 'Row written successfully!'

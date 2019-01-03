"""Provides a method for overwriting a row in a Google Sheet with new information"""
from worksheet_connection import get_sheet


def handler(body, req):
    """Handles requests and performs the update on the Google Sheet"""
    if (body is None or body['values'] is None or
            not isinstance(body['values'], list)):
        raise Exception('Invalid request body.')
    if (req.query is None or req.query['key'] is None):
        raise Exception('Invalid request: missing query params.')

    worksheet = get_sheet()
    worksheet.insert_row(body['values'], req.query['key'])
    return 'Row written successfully!'

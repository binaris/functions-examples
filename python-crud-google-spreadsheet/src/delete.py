"""Provides a method for deleting a row from a Google Sheet"""
from worksheet_connection import get_sheet

def handler(body, req):
    """Handles reqests and performs the delete on the Google Sheet"""
    if (body is None or body['key'] is None or body['object'] is None):
        raise Exception('Invalid request body.')
    if (req.query is not None and req.query['key'] is not None):
        raise Exception('Invalid request: missing query params.')

    worksheet = get_sheet()
    row = worksheet.row_values(req.query['key'])
    if row is None:
        raise Exception('Row number %d ineligible for deletion.'
                        % (req.query['key']))
    else:
        worksheet.delete_row(req.query['key'])
    return 'Row %d deleted successfully!' % (req.query['key'])

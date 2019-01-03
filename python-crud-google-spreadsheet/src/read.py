"""Provides a method for reading a row from a Google Sheet"""
from worksheet_connection import get_sheet

def handler(req):
    """Handles requests and reads a row from the Google Sheet"""

    worksheet = get_sheet()
    if (req.query is not None and req.query['key'] is not None):
        return worksheet.row_values(req.query['key'])
    return worksheet.get_all_values()

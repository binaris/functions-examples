stanza = """

def handler(body, ctx):
    marker = chr(34) * 3
    quine = 'stanza = ' + marker + stanza + marker + stanza
    return ctx.HTTPResponse(body='{}'.format(quine))
"""

def handler(body, ctx):
    marker = chr(34) * 3
    quine = 'stanza = ' + marker + stanza + marker + stanza
    return ctx.HTTPResponse(body='{}'.format(quine))

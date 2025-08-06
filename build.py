from string import Template
import os

BASE_DIR = os.path.dirname(__file__)
TEMPLATE_DIR = os.path.join(BASE_DIR, 'templates')

layout_path = os.path.join(TEMPLATE_DIR, 'layout.html')
with open(layout_path, encoding='utf-8') as f:
  layout_tpl = Template(f.read())

pages = [
    {
        'template': 'index.html',
        'output': 'index.html',
        'styles': '',
        'scripts': '<script src="static/js/app.js"></script>'
    },
    {
        'template': 'roadtrip_usa_2026.html',
        'output': 'roadtrip_usa_2026.html',
        'styles': '<link rel="stylesheet" href="static/css/roadtrip.css" />',
        'scripts': '<script src="static/js/roadtrip.js"></script>'
    }
]

for page in pages:
    template_path = os.path.join(TEMPLATE_DIR, page['template'])
    with open(template_path, encoding='utf-8') as f:
        content = f.read()
    html = layout_tpl.safe_substitute(
        title='Road Trip USA 2026',
        styles=page.get('styles', ''),
        content=content,
        scripts=page.get('scripts', '')
    )
    output_path = os.path.join(BASE_DIR, page['output'])
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Generated {page['output']}")

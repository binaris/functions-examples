/* eslint-disable no-undef  */

let numSearches = 0;
const searchCounter = document.getElementById('searchCounter');

const searchTerms = document.getElementById('searchTermsInput');
const output = document.getElementById('results');

const apiKey = new URL(document.location).searchParams.get('apiKey');
if (apiKey === null) {
  searchCounter.innerHTML = `
    <div class="alert alert-danger" role="alert">
        No Binaris API Key! Please send the API Key as a query string param, e.g. <code>index.html?apiKey=xxxxx</code>
    </div>`;
  searchTerms.setAttribute('readonly', true);
  searchTerms.setAttribute('placeholder', 'No API Key');
}

searchTerms.addEventListener('input', async () => {
  const data = searchTerms.value.split(/\s+/g);
  numSearches += 1;
  searchCounter.innerHTML = `${numSearches}${numSearches === 1 ? ' request' : ' requests'} served`;
  fetch(`https://run.binaris.com/v1/run/${apiKey}/search`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then(res => res.json())
    .then((response) => {
      output.innerHTML = response.map(res => `
        <div class="row search-row">
            <div class="col-md-4 image-col">
                <img src="${res.picture}" alt="${res.name}" style="max-width: 100%; max-height: 150px">
            </div>
            <div class="col-md-8">
                <h3>${res.name}</h3>
            </div>
        </div>`).join('');
    })
    .catch(error => console.error('Error:', error));
});

searchTerms.focus();

/* eslint-disable no-unused-vars, no-undef, consistent-return, no-use-before-define  */

const Binaris = (() => {
  function request(verb, url, data, callback) {
    const req = new XMLHttpRequest();
    req.onload = () => {
      callback(req.status, req.responseText);
    };
    req.onerror = () => {
      callback(0, 'Network error');
    };
    req.open(verb, url, true);
    req.send(data);
  }

  function binaris(key) {
    function invoke(fname, fargs) {
      return new Promise((resolve, reject) => {
        if (typeof (fname) !== 'string' || !/^[a-zA-Z][a-zA-Z0-9]*$/.test(fname)) {
          return reject(new Error(`Invalid function name: ${fname}`));
        }
        const URL = `https://run.binaris.com/v1/run/${key}/${fname}`;
        request('POST', URL, JSON.stringify(fargs), (status, response) => {
          if (status !== 200) {
            return reject(new Error(`HTTP error ${status}: ${response}`));
          }
          try {
            resolve(response.length ? JSON.parse(response) : undefined);
          } catch (e) {
            reject(new Error(`Non-JSON response: ${response}`));
          }
        });
      });
    }

    const handlers = {
      get: (target, name) => (
        (name in target || typeof (name) === 'symbol' || name === 'inspect') ? target[name] : createProxy(target, name)
      ),
      apply: (target, _unused, args) => {
        const [fname, fargs] = target.path ? [target.path.join('.'), args[0]] : [args[0], args[1]];
        return invoke(fname, fargs);
      },
    };

    function createProxy(target, name) {
      const f = () => {};
      f.invoke = invoke;
      if (target && name) {
        f.path = (target.path || []).concat(name);
      }
      return new Proxy(f, handlers);
    }

    return createProxy();
  }

  return binaris;
})();

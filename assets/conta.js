/*
  conta.js — comportamentos das telas de conta (Mater)
  - Mostrar/ocultar senha ([data-toggle-password])
  - Medidor de força da senha ([data-strength])
  - Confere "confirmar senha" ([data-confirm])
  - Evita envio duplo (botão com aria-busy)
  - Leva o foco ao aviso de erro/sucesso ([data-focus])
  - Busca endereço pelo CEP no ViaCEP ([data-cep])
  Tudo é progressivo: sem JS os formulários continuam funcionando.
*/
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Mostrar / ocultar senha
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      var input = btn.parentElement.querySelector('input');
      if (!input) return;
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
        input.focus();
      });
    });

    // Força da senha: 1 fraca, 2 boa, 3 forte
    document.querySelectorAll('[data-strength]').forEach(function (meter) {
      var input = document.getElementById(meter.getAttribute('data-strength'));
      var label = meter.querySelector('.conta__strength-label');
      if (!input) return;
      var names = ['', 'Fraca', 'Boa', 'Forte'];
      input.addEventListener('input', function () {
        var v = input.value;
        var score = 0;
        if (v.length >= 5) score++;
        if (v.length >= 8 && /\d/.test(v) && /[a-zA-Z]/.test(v)) score++;
        if (v.length >= 10 && /[^a-zA-Z0-9]/.test(v)) score++;
        if (v.length > 0 && score === 0) score = 1;
        meter.setAttribute('data-level', v.length ? score : 0);
        if (label) label.textContent = v.length ? names[score] : '';
      });
    });

    // Confirmar senha
    document.querySelectorAll('[data-confirm]').forEach(function (confirm) {
      var original = document.getElementById(confirm.getAttribute('data-confirm'));
      if (!original) return;
      function check() {
        confirm.setCustomValidity(confirm.value && confirm.value !== original.value ? 'As senhas não são iguais.' : '');
      }
      confirm.addEventListener('input', check);
      original.addEventListener('input', check);
    });

    // Evita envio duplo
    document.querySelectorAll('.conta__form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var btn = e.submitter || form.querySelector('button[type=submit]');
        if (btn && form.checkValidity()) btn.setAttribute('aria-busy', 'true');
      });
    });

    // Recuperar senha: foca o e-mail ao abrir via #recover
    function focusRecover() {
      if (location.hash !== '#recover') return;
      var input = document.querySelector('#recover input[type=email]');
      if (input) setTimeout(function () { input.focus(); }, 50);
    }
    window.addEventListener('hashchange', focusRecover);
    focusRecover();

    // Aviso de erro/sucesso recebe o foco
    var notice = document.querySelector('[data-focus]');
    if (notice) {
      notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
      notice.focus({ preventScroll: true });
    }

    // CEP → endereço (ViaCEP)
    var UF = {
      AC: 'Acre', AL: 'Alagoas', AP: 'Amapa', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceara',
      DF: 'Distrito Federal', ES: 'Espirito Santo', GO: 'Goias', MA: 'Maranhao',
      MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Para',
      PB: 'Paraiba', PR: 'Parana', PE: 'Pernambuco', PI: 'Piaui', RJ: 'Rio de Janeiro',
      RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondonia', RR: 'Roraima',
      SC: 'Santa Catarina', SP: 'Sao Paulo', SE: 'Sergipe', TO: 'Tocantins'
    };
    var ACCENTS = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
    function plain(s) {
      return (s || '').normalize('NFD').replace(ACCENTS, '').toLowerCase().trim();
    }
    document.querySelectorAll('[data-cep]').forEach(function (cep) {
      var form = cep.closest('form');
      cep.addEventListener('input', function () {
        var d = cep.value.replace(/\D/g, '').slice(0, 8);
        cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
        if (d.length !== 8) return;
        fetch('https://viacep.com.br/ws/' + d + '/json/')
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data || data.erro) return;
            var set = function (name, value) {
              var el = form.querySelector('[name="address[' + name + ']"]');
              if (el && value && !el.value) el.value = value;
            };
            set('address1', data.logradouro);
            set('address2', data.bairro);
            set('city', data.localidade);
            var province = form.querySelector('[name="address[province]"]');
            if (province && data.uf && UF[data.uf]) {
              var target = plain(UF[data.uf]);
              for (var i = 0; i < province.options.length; i++) {
                if (plain(province.options[i].text) === target || plain(province.options[i].value) === target) {
                  province.selectedIndex = i;
                  break;
                }
              }
            }
            var a1 = form.querySelector('[name="address[address1]"]');
            if (a1 && data.logradouro) {
              a1.focus();
              a1.setSelectionRange(a1.value.length, a1.value.length);
            }
          })
          .catch(function () {});
      });
    });
  });
})();

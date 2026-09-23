/*
  ============================================================
  card-variantes.js — cor e tamanho direto no card de produto
  ============================================================

  O QUE FAZ:
  No snippet card-product-compra, cada grupo [data-card-option] (as
  bolinhas de cor e os botões de tamanho) guarda o índice da opção do
  Shopify. Ao clicar num valor:
  1. marca o botão escolhido (is-selected / aria-checked);
  2. procura a variante com a combinação escolhida no JSON
     [data-card-variants] e grava o id no input [data-card-variant-id]
     — é esse id que o form 'product' envia;
  3. risca (is-unavailable) os valores sem estoque para as demais
     escolhas — ex.: tamanhos esgotados na cor selecionada;
  4. desabilita "Adicionar" / "Comprar agora" se a combinação estiver
     esgotada ou não existir.

  Tudo por delegação no document, então funciona também em cards
  carregados depois (ex.: "mostrar mais" da coleção).
*/
(function () {
  function readVariants(card) {
    var el = card.querySelector('[data-card-variants]');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function update(card) {
    var variants = readVariants(card);
    var input = card.querySelector('[data-card-variant-id]');
    if (!variants || !input) return;

    var current = variants.find(function (v) { return String(v.id) === input.value; }) || variants[0];
    var chosen = current.options.slice();
    var groups = card.querySelectorAll('[data-card-option]');

    groups.forEach(function (group) {
      var selected = group.querySelector('.is-selected[data-value]');
      if (selected) chosen[Number(group.dataset.cardOption)] = selected.dataset.value;
    });

    // Valor disponível = existe variante com estoque que tem esse valor e
    // bate com as escolhas das OUTRAS opções.
    groups.forEach(function (group) {
      var index = Number(group.dataset.cardOption);
      group.querySelectorAll('[data-value]').forEach(function (button) {
        var ok = variants.some(function (v) {
          return v.available && v.options.every(function (value, i) {
            return i === index ? value === button.dataset.value : value === chosen[i];
          });
        });
        button.classList.toggle('is-unavailable', !ok);
      });
    });

    var match = variants.find(function (v) {
      return v.options.every(function (value, i) { return value === chosen[i]; });
    });
    if (match) input.value = match.id;

    var canBuy = !!(match && match.available);
    card.querySelectorAll('.card-compra__btn').forEach(function (button) {
      button.disabled = !canBuy;
      if (button.dataset.labelAdd) {
        button.textContent = canBuy ? button.dataset.labelAdd : button.dataset.labelSoldout;
      }
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-card-option] [data-value]');
    if (!button) return;
    var group = button.closest('[data-card-option]');
    var card = button.closest('.card-compra');
    if (!card) return;

    group.querySelectorAll('[data-value]').forEach(function (b) {
      var on = b === button;
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    update(card);
  });

  function init() {
    document.querySelectorAll('.card-compra [data-card-variants]').forEach(function (el) {
      update(el.closest('.card-compra'));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

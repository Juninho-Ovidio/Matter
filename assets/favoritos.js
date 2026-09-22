/*
  ============================================================
  favoritos.js — Botao de favoritar dos cards de produto
  ============================================================

  O QUE FAZ:
  Liga os botoes [data-wishlist-toggle] renderizados por
  snippets/card-product.liquid. Guarda os ids dos produtos
  favoritados no localStorage do navegador e reflete o estado
  em aria-pressed (o CSS preenche o coracao a partir disso).

  Usa delegacao de evento no document, entao funciona tambem
  para cards inseridos depois (paginacao via AJAX, filtros, etc).

  LIMITACOES (de proposito):
  E um favorito LOCAL: vale por navegador/dispositivo e nao tem
  nada a ver com a conta do cliente nem com o admin da loja. Se o
  cliente trocar de aparelho ou limpar os dados do site, a lista
  se perde. Para favoritos de verdade, ligados ao customer, seria
  preciso um app de wishlist ou metafields de cliente.

  Sem JS o botao simplesmente nao faz nada - nenhuma outra parte
  da pagina depende dele.
*/
(function () {
  'use strict';

  var CHAVE = 'mater:favoritos';

  function ler() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      var lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (e) {
      // Modo privado, cookies bloqueados, JSON corrompido: segue sem favoritos.
      return [];
    }
  }

  function gravar(lista) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(lista));
    } catch (e) {
      /* storage cheio ou indisponivel: o estado visual da sessao continua valendo */
    }
  }

  function sincronizar() {
    var lista = ler();
    document.querySelectorAll('[data-wishlist-toggle]').forEach(function (botao) {
      var id = botao.getAttribute('data-product-id');
      botao.setAttribute('aria-pressed', String(lista.indexOf(id) !== -1));
    });
  }

  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-wishlist-toggle]');
    if (!botao) return;

    evento.preventDefault();
    var id = botao.getAttribute('data-product-id');
    if (!id) return;

    var lista = ler();
    var posicao = lista.indexOf(id);
    if (posicao === -1) {
      lista.push(id);
    } else {
      lista.splice(posicao, 1);
    }
    gravar(lista);
    botao.setAttribute('aria-pressed', String(posicao === -1));
  });

  document.addEventListener('DOMContentLoaded', sincronizar);
})();

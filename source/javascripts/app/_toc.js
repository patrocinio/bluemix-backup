//= require ../lib/_jquery
//= require ../lib/_jquery_ui
//= require ../lib/_jquery.tocify
//= require ../lib/_imagesloaded.min
(function (global) {
  'use strict';

  var closeToc = function() {
    $(".tocify-wrapper").removeClass('open');
    $("#nav-button").removeClass('open');
  };

  var makeToc = function() {
    global.toc = $("#toc").tocify({
      selectors: 'h1, h2, h3, h4',
      extendPage: false,
      theme: 'none',
      smoothScroll: false,
      showEffectSpeed: 0,
      hideEffectSpeed: 180,
      ignoreSelector: '.toc-ignore',
      highlightOffset: 60,
      scrollTo: -1,
      scrollHistory: true,
      hashGenerator: function (text, element) {
        return element.prop('id');
      }
    }).data('toc-tocify');

    $("#nav-button").click(function() {
      $(".tocify-wrapper").toggleClass('open');
      $("#nav-button").toggleClass('open');
      return false;
    });

    $(".page-wrapper").click(closeToc);
    $(".tocify-item").click(closeToc);
  };

  // Hack to make already open sections to start opened,
  // instead of displaying an ugly animation
  function animate() {
    setTimeout(function() {
      toc.setOption('showEffectSpeed', 180);
    }, 50);
  }

  function hideCode() {
    Cookies.set('hide-code-column', true);
    var hash = window.location.hash;
    $('blockquote').hide();
    $('pre.highlight').hide();
    $('div.blockquote').hide();
    $('.dark-box').css('width', '20px');
    $('#hideCodeButton').hide();
    $('#showCodeButton').show();
    $('#expand-collapse-code').toggleClass('hide-code-column');
    var contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'table', 'ul', 'ol', 'aside', 'dl'];
    for (var i in contentTags) {
      $('.content > ' + contentTags[i]).css('margin-right', '20px');
    }
    if ($(hash).offset()) {
      $(document).scrollTop($(hash).offset().top);
    }
    window.location.hash = hash;
    $(window).trigger('resize');
  };

    function getAlwaysShownLangs() {
        var foundLangs = new Array(),
            ignore = $('body').data('languages') || [];
        ignore.push('highlight');

        var res = $('pre.highlight').each(function(i, el){
            var langs = $(el).attr('class').split(/\s+/).filter(function(cssClass){
                if (ignore.indexOf(cssClass) == -1) {
                    return cssClass;
                }
            });
            return foundLangs.push(langs);
        });
        var flattened = foundLangs.reduce(function(a, b) {
            return a.concat(b);
        }, []);

        var final = flattened.reduce(function(p, c) {
            if (p.indexOf(c) < 0) p.push(c);
            return p;
        }, []);
        return final;
    }

  function showCode() {
    Cookies.remove('hide-code-column');
    var hash = window.location.hash,
        activeLanguage = $('div.lang-selector > a.active').data('language-name');
    activateLanguage(activeLanguage);
    getAlwaysShownLangs().forEach(function(lang){
        $('pre.' + lang).show();
    });
    $('blockquote').show();
    $('div.blockquote').show();
    $('.dark-box').css('width', '50%');
    $('#hideCodeButton').show();
    $('#showCodeButton').hide();
    $('#expand-collapse-code').toggleClass('hide-code-column');
    var contentTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'table', 'ul', 'ol', 'aside', 'dl'];
    for (var i in contentTags) {
      $('.content > ' + contentTags[i]).css('margin-right', '50%');
    }
    if ($(hash).offset()) {
      $(document).scrollTop($(hash).offset().top);
    }
    window.location.hash = hash;
    $(window).trigger('resize');
  };

  $(function() {
    makeToc();
    animate();
    setupLanguages($('body').data('languages'));
    $('.content').imagesLoaded( function() {
      global.toc.calculateHeights();
    });
    if (Cookies.get('hide-code-column')) hideCode();
    $('#hideCodeButton').click(hideCode);
    $('#showCodeButton').click(showCode);
  });
})(window);

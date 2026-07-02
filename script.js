document.addEventListener('DOMContentLoaded', function () {
  // Music controls
  var audio = document.getElementById('birthday');
  var playBtn = document.getElementById('playMusic');

  if (playBtn && audio) {
    playBtn.addEventListener('click', function () {
      if (audio.paused) {
        audio.play().then(function () {
          playBtn.textContent = 'Pause Birthday Song';
        }).catch(function (err) {
          // Autoplay or other restrictions; still change label
          playBtn.textContent = 'Pause Birthday Song';
          console.warn('Could not play audio automatically:', err);
        });
      } else {
        audio.pause();
        playBtn.textContent = 'Play Birthday Song';
      }
    });

    // Keep button label in sync if user manipulates audio via other controls
    audio.addEventListener('pause', function () { playBtn.textContent = 'Play Birthday Song'; });
    audio.addEventListener('ended', function () { playBtn.textContent = 'Play Birthday Song'; });
    audio.addEventListener('play', function () { playBtn.textContent = 'Pause Birthday Song'; });
  }

  // Love letter modal handling (opens and works correctly)
  var loveBtn = document.getElementById('loveLetterBtn');
  var modal = document.getElementById('loveModal');
  var closeBtn = document.getElementById('closeLove');

  function openLoveLetter() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    // trap focus to modal first focusable element for accessibility
    setTimeout(function () {
      var focusable = modal.querySelector('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }, 10);
  }

  function closeLoveLetter() {
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    // return focus to the opener
    if (loveBtn) loveBtn.focus();
  }

  if (loveBtn) {
    loveBtn.addEventListener('click', openLoveLetter);
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLoveLetter);
  }
  if (modal) {
    // clicking outside content closes modal
    modal.addEventListener('click', function (ev) {
      if (ev.target === modal) closeLoveLetter();
    });
    // close with Escape key
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
        closeLoveLetter();
      }
    });
  }
});

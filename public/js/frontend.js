jQuery(document).ready(function ($) {
  function startCounterAnimation($container) {
    $container.find(".zlgcb-counter-box").each(function () {
      let $this = $(this);
      let start = parseInt($this.data("start"), 10);
      let end = parseInt($this.data("end"), 10);
      let duration = parseInt($this.data("duration"), 10);
      let suffix = $this.data("suffix");
      let prefix = $this.data("prefix");
      let counterNumberLoaderColor = $this.data("counternumberloadercolor");

      let count = start;
      let stepTime = duration / (end - start);
      let totalSteps = end - start;
      let increment = 360 / totalSteps;

      let circle1 = 90;
      let circle2 = 90;

      let countdown = setInterval(function () {
        let i1 = "linear-gradient(" +
          circle1 +
          "deg, transparent 50%, white 50%), linear-gradient(90deg, white 50%, transparent 50%)";
        let i2;
        if (count >= end) {
          i2 =
            "linear-gradient(450deg," +
            counterNumberLoaderColor +
            " 48%, transparent 48%)";
        } else {
          i2 =
            "linear-gradient(" +
            circle2 +
            "deg, transparent 50%," +
            counterNumberLoaderColor +
            " 48%), linear-gradient(90deg, white 50%, transparent 50%)";
        }

        if (count < 10) {
          count = "0" + count;
        }

        $this.find(".zlgcb-counter-number").html(prefix + " " + count + " " + suffix);

        if (count - start <= totalSteps / 2) {
          circle1 += increment;
          $this.find(".zlgcb-circle-fill").css("background-image", i1);
        } else {
          circle2 += increment;
          $this.find(".zlgcb-circle-fill").css("background-image", i2);
        }

        if (count >= end) {
          clearInterval(countdown);
        }

        count++;
      }, stepTime);
    });
  }

  startCounterAnimation($(document));
});

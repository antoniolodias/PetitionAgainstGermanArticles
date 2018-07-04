(function() {
    var canvas = $("canvas");
    var signing = false;
    var x;
    var y;

    canvas.on("mousedown", e => {
        console.log("mousedown works ");
        signing = true;
        x = e.offsetX;
        y = e.offsetY;
    });

    canvas.on("mouseup", () => {
        signing = false;
        var data = document.getElementById("canvas").toDataURL();
        $("input[name=signature]").val(data);
    });

    canvas.on("mousemove", e => {
        if (signing == true) {
            var context = document.getElementById("canvas").getContext("2d");
            context.strokeStyle = "white";
            context.lineWidth = 3;
            context.moveTo(x, y);
            context.lineTo(e.offsetX, e.offsetY);
            context.stroke();
            x = e.offsetX;
            y = e.offsetY;
        }
    });
})();

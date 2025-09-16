document.addEventListener('DOMContentLoaded', function() {
    // Create aurora layer if it doesn't exist
    let sparkleLayer = document.getElementById('sparkleLayer');
    if (!sparkleLayer) {
        sparkleLayer = document.createElement('div');
        sparkleLayer.id = 'sparkleLayer';
        document.body.appendChild(sparkleLayer);
    }

    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;

        const mouseXPercent = (mouseX / window.innerWidth) * 100;
        const mouseYPercent = (mouseY / window.innerHeight) * 100;

        // Subtle aurora shift based on mouse position
        const offsetX = (mouseXPercent - 50) * 0.05;
        const offsetY = (mouseYPercent - 50) * 0.02;
        const skewAdjust = (mouseXPercent - 50) * 0.05;

        sparkleLayer.style.transform = `translate(${offsetX}px, ${offsetY}px) skewX(${skewAdjust}deg)`;
        sparkleLayer.style.filter = `blur(${1 + Math.abs(mouseXPercent - 50) * 0.01}px)`;
    });
});
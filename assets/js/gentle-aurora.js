document.addEventListener('DOMContentLoaded', function() {
    // Create lovely aurora container
    let auroraLayer = document.getElementById('gentleAurora');
    if (!auroraLayer) {
        auroraLayer = document.createElement('div');
        auroraLayer.id = 'gentleAurora';
        document.body.appendChild(auroraLayer);
    }

    // Create three aurora shapes
    const shapes = [
        { class: 'aurora-one', color: 'linear-gradient(45deg, #ff6b6b, #feca57)' },
        { class: 'aurora-two', color: 'linear-gradient(45deg, #48cae4, #0077b6)' },
        { class: 'aurora-three', color: 'linear-gradient(45deg, #c77dff, #560bad)' }
    ];

    shapes.forEach(shape => {
        const shapeDiv = document.createElement('div');
        shapeDiv.className = `aurora-shape ${shape.class}`;
        auroraLayer.appendChild(shapeDiv);
    });
});
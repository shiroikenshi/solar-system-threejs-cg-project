// Função para remover e adicionar elementos da cena
function sceneAdd(buttonId, element, buttonName) {
    const toggleButton = document.getElementById(buttonId);

    let isVisible = true;

    toggleButton.addEventListener('click', () => {
        isVisible = !isVisible;

        if (isVisible) {
            scene.add(element);
            toggleButton.textContent = `Desligar ${buttonName}`;
        } else {
            scene.remove(element);
            toggleButton.textContent = `Ligar ${buttonName}`;
        }
    });
}

// Função para criar um cinturão de asteroides
function createAsteroidBelt(numAsteroids, radius, minSize, maxSize, bandWidth, bandHeight) {
    var asteroidGroup = new THREE.Group(); // Criar um grupo para o cinturão de asteroides

    for (var i = 0; i < numAsteroids; i++) {
        var angle = Math.random() * (2 * Math.PI);
        var tamAsteroide = minSize + Math.random() * (maxSize - minSize);
        var distance = radius + (Math.random() * bandWidth - bandWidth / 2); // Distribuição ao longo do raio com largura de banda
        var height = Math.random() * bandHeight - bandHeight / 2; // Altura dentro da banda
        
        var asteroidGeometry = new THREE.IcosahedronGeometry(tamAsteroide, 0);
        var asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
        
        asteroid.position.set(Math.sin(angle) * distance, Math.cos(angle) * distance, height);
        asteroid.rotation.set(Math.random() * (2 * Math.PI), Math.random() * (2 * Math.PI), Math.random() * (2 * Math.PI));

        asteroid.radius = distance;
        asteroid.velocity = Math.random() * 0.1;
        
        asteroidGroup.add(asteroid); // Adicionar o asteroide ao grupo
    }
    
    return asteroidGroup; // Retornar o grupo
}
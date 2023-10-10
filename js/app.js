
function iniciarApp() {

    const resultado = document.querySelector('#resultado');

    const selectCategorias = document.querySelector('#categorias');

    if (selectCategorias) {
        selectCategorias.addEventListener('change', seleccionarCategoria);
        obtenerCategorias();
    }

    const favoritosDiv = document.querySelector('.favoritos');
    if(favoritosDiv){
        obtenerFavoritos();
    }

    const modal = new bootstrap.Modal('#modal', {});



    function obtenerCategorias() {
        const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';
        fetch(url)
            .then(respuesta => {
                return respuesta.json();
            })
            .then(resultado => {
                mostrarCategorias(resultado.categories);
            })
    }

    function mostrarCategorias(categorias = []) {
        categorias.forEach(categoria => {
            const option = document.createElement('OPTION');
            option.value = categoria.strCategory;
            option.textContent = categoria.strCategory;

            selectCategorias.appendChild(option);
        })
    }

    function seleccionarCategoria(e) {
        const categoria = e.target.value;
        const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetas(resultado.meals))
    }

    function mostrarRecetas(recetas = []) {
        limpiarHTML(resultado);
        // console.log(recetas)

        const heading = document.createElement('H2');
        heading.classList.add('text-center', 'text-black', 'my-5')
        heading.textContent = recetas.length ? 'Resultados' : 'No hay resultados';
        resultado.appendChild(heading);

        //Iterar en los resultados
        recetas.forEach(receta => {
            // console.log(receta);

            const { idMeal, strMeal, strMealThumb } = receta;
            const recetaConetedor = document.createElement('DIV');
            recetaConetedor.classList.add('col-md-4');

            const recetaCard = document.createElement('DIV');
            recetaCard.classList.add('card', 'mb-4');

            const recetaImagen = document.createElement('IMG');
            recetaImagen.classList.add('card-img-top');
            recetaImagen.alt = `Imagen de la receta ${strMeal ?? receta.titulo}`;
            recetaImagen.src = strMealThumb ?? receta.img;
            //la linea de arriba hace que evitemos el undefined ya que le dice que si no lo encuentra, agregue la receta.img (la imagen) que hay en local storage
            // console.log(recetaImagen);

            const recetaCardBody = document.createElement('DIV');
            recetaCardBody.classList.add('card-body');

            const recetaHeading = document.createElement('H3');
            recetaHeading.classList.add('card-title', 'mb-3');
            recetaHeading.textContent = strMeal ?? receta.titulo;
            //lo mismo que con el strMealThum, lo que hace es que la primera parte hace la consulta al API, pero en favoritos lo que vamos a consultar es LocalStorage por lo que necesitamos hacer que si no lo encuentra como API, lo podamos acceder como localstorage, para ello usamos ?? receta.XXXX 
            // console.log(recetaHeading);

            const recetaButton = document.createElement('BUTTON');
            recetaButton.classList.add('btn', 'btn-danger', 'w-100');
            recetaButton.textContent = 'Ver Receta';

            //Configurar el modal del boton
            // recetaButton.dataset.bsTarget = "#modal";
            // recetaButton.dataset.bsToggle = "modal";
            recetaButton.onclick = function () {
                seleccionarReceta(idMeal ?? receta.id);
            }

            //Inyectar en el HTML
            //Lo que construimos aqui es lo siguiente:
            //Contenedor
            // .card   
            //     Img
            //       .card-body 
            //             h3
            //             button 

            recetaCardBody.appendChild(recetaHeading);
            recetaCardBody.appendChild(recetaButton);

            recetaCard.appendChild(recetaImagen);
            recetaCard.appendChild(recetaCardBody);

            recetaConetedor.appendChild(recetaCard);
            //El orden de como los agreguemos es importante para construir correctamente lo que queremos

            resultado.appendChild(recetaConetedor);
        })
    }

    function seleccionarReceta(id) {
        const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

        fetch(url)
            .then(respuesta => respuesta.json())
            .then(resultado => mostrarRecetaModal(resultado.meals[0]))
    }

    function mostrarRecetaModal(receta) {

        const { idMeal, strInstructions, strMeal, strMealThumb } = receta;

        //Anadir contenido al modal
        const modalTitle = document.querySelector('.modal .modal-title');
        const modalBody = document.querySelector('.modal .modal-body');

        modalTitle.textContent = strMeal;
        modalBody.innerHTML = `
            <img class="img-fluid" src="${strMealThumb}" alt="receta" ${strMeal}/>
            <h3 class="my-3">Instrucciones: </h3>
            <p>${strInstructions}</p>
            <h3 class="my-3">Ingredientes y Cantidades:</h3>
            `;

        const listGroup = document.createElement('UL');
        listGroup.classList.add('list-group');
        //mostrar cantidades e ingredientes
        for (let i = 1; i <= 20; i++) {
            // console.log(receta[`strIngredient${i}`])
            if (receta[`strIngredient${i}`]) {
                const ingrediente = receta[`strIngredient${i}`];
                const cantidad = receta[`strMeasure${i}`];

                // console.log(`${ingrediente} - ${cantidad}`)
                //renderizar en el html
                const ingredienteLi = document.createElement('LI');
                ingredienteLi.classList.add('list-group-item');
                ingredienteLi.textContent = `${ingrediente} - ${cantidad}`;

                listGroup.appendChild(ingredienteLi);
            }
        }

        modalBody.appendChild(listGroup);

        //Agregar botones de cerrar y favorito
        const modalFooter = document.querySelector('.modal-footer');
        limpiarHTML(modalFooter);

        const btnFavorito = document.createElement('BUTTON');
        btnFavorito.classList.add('btn', 'btn-danger', 'col');
        btnFavorito.textContent = existeStorage(idMeal) ? 'Eliminar Favorito' : 'Guardar Favorito';
        modalFooter.appendChild(btnFavorito);

        //local storage
        btnFavorito.onclick = function () {
            // console.log(existeStorage(idMeal));

            if (existeStorage(idMeal)) {
                eliminarFavorito(idMeal);
                btnFavorito.textContent = 'Guardar Favorito';
                mostrarToast('Eliminado Correctamente!!');
                return
            }

            agregarFavorito({
                id: idMeal,
                titulo: strMeal,
                img: strMealThumb
            });
            btnFavorito.textContent = 'Eliminar Favorito';
            mostrarToast('Agregado Correctamente!!');
        }

        const btnCerrarModal = document.createElement('BUTTON');
        btnCerrarModal.classList.add('btn', 'btn-secondary', 'col');
        btnCerrarModal.textContent = 'Cerrar';
        modalFooter.appendChild(btnCerrarModal);

        btnCerrarModal.onclick = function () {
            modal.hide();
        }

        //muestra el modal
        modal.show();
    }

    function agregarFavorito(receta) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        //en este contexto ?? hacen que si el JSON que le estamos pasando es = null. que entonces agregue un [] vacio
        localStorage.setItem('favoritos', JSON.stringify([...favoritos, receta]));
    }

    function eliminarFavorito(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        const nuevosFavoritos = favoritos.filter(favorito => favorito.id !== id);
        //filter nos permite sacar arreglos que cumplan o no una condicion, de igual forma favorito es una variable temporal, tare todos los que sean diferentes al que le estamos pasando
        localStorage.setItem('favoritos', JSON.stringify(nuevosFavoritos));
    }

    function existeStorage(id) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        return favoritos.some(favorito => favorito.id === id);
        //some agrega la variable temporal favorito, itera sobre el arreglo de favoritos y regresa true si el id que le estamos pasando coincide con alguno que ya exista en LocalStorage

    }

    function mostrarToast(mensaje) {
        const toastDiv = document.querySelector('#toast');
        const toastBody = document.querySelector('.toast-body');
        const toast = new bootstrap.Toast(toastDiv);

        toastBody.textContent = mensaje;
        toast.show();
    }

    function obtenerFavoritos(){
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        // console.log(favoritos)
        if(favoritos.length){
            mostrarRecetas(favoritos);
            return
        }
        const noFavoritos = document.createElement('P');
        noFavoritos.textContent = 'No hay ningun favorito!!';
        noFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');

        favoritosDiv.appendChild(noFavoritos);
    }

    function limpiarHTML(selector) {
        while (selector.firstChild) {
            selector.removeChild(selector.firstChild);
        }
    }

}

document.addEventListener('DOMContentLoaded', iniciarApp);
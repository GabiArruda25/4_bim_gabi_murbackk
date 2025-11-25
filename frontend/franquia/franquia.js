const API_BASE_URL = '/franquia/api';

document.addEventListener('DOMContentLoaded', () => {
    loadFranquias();
    document.getElementById('franquia-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancel-btn').addEventListener('click', resetForm);
});

async function loadFranquias() {
    try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
            throw new Error('Erro ao carregar franquias. Talvez você não esteja logado como gerente.');
        }
        const franquias = await response.json();
        const tableBody = document.querySelector('#franquia-table tbody');
        tableBody.innerHTML = ''; // Limpa a tabela

        franquias.forEach(franquia => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = franquia.id_franquia;
            row.insertCell().textContent = franquia.nome_franquia;
            row.insertCell().textContent = franquia.endereco_franquia || '';
            row.insertCell().textContent = franquia.telefone_franquia || '';
            
            const actionsCell = row.insertCell();
            actionsCell.className = 'action-buttons';
            
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Editar';
            editBtn.className = 'edit-btn';
            editBtn.onclick = () => fillFormForEdit(franquia);
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Excluir';
            deleteBtn.className = 'delete-btn';
            deleteBtn.onclick = () => deleteFranquia(franquia.id_franquia);
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const id = document.getElementById('id_franquia').value;
    const nome_franquia = document.getElementById('nome_franquia').value;
    const endereco_franquia = document.getElementById('endereco_franquia').value;
    const telefone_franquia = document.getElementById('telefone_franquia').value;

    const franquiaData = {
        nome_franquia,
        endereco_franquia,
        telefone_franquia
    };

    try {
        let response;
        if (id) {
            // Atualizar
            response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(franquiaData)
            });
        } else {
            // Criar
            response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(franquiaData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar franquia.');
        }

        alert(`Franquia ${id ? 'atualizada' : 'criada'} com sucesso!`);
        resetForm();
        loadFranquias();

    } catch (error) {
        console.error('Erro ao salvar franquia:', error);
        alert(error.message);
    }
}

function fillFormForEdit(franquia) {
    document.getElementById('id_franquia').value = franquia.id_franquia;
    document.getElementById('nome_franquia').value = franquia.nome_franquia;
    document.getElementById('endereco_franquia').value = franquia.endereco_franquia || '';
    document.getElementById('telefone_franquia').value = franquia.telefone_franquia || '';
    document.getElementById('submit-btn').textContent = 'Atualizar';
    document.getElementById('cancel-btn').style.display = 'inline-block';
}

function resetForm() {
    document.getElementById('franquia-form').reset();
    document.getElementById('id_franquia').value = '';
    document.getElementById('submit-btn').textContent = 'Salvar';
    document.getElementById('cancel-btn').style.display = 'none';
}

async function deleteFranquia(id) {
    if (!confirm('Tem certeza que deseja excluir esta franquia?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao excluir franquia.');
        }

        alert('Franquia excluída com sucesso!');
        loadFranquias();

    } catch (error) {
        console.error('Erro ao excluir franquia:', error);
        alert(error.message);
    }
}

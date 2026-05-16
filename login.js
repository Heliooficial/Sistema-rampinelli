// 1. Banco de dados temporário de usuários e seus destinos
const usuariosCadastrados = {
    "Fatura": { senha: "fatu@", destino: "manuais/faturamento.pdf" },
    "Logistica": { senha: "logis123", destino: "manuais/estoque.pdf" },
    "Financeiro": { senha: "fin@", destino: "manuais/financeiro.pdf" },
    "Producao": { senha: "prod123", destino: "manuais/producao.pdf" },
    "Estoque": { senha: "esto123", destino: "manuais/estoque.pdf" },
    "Admin": { senha: "admin", destino: "index.html" } // Acessa a tela principal com tudo
};

// 2. Escuta o envio do formulário de login
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Impede a página de recarregar

    const usuarioInput = document.getElementById('username').value.trim();
    const senhaInput = document.getElementById('password').value;
    const erroDiv = document.getElementById('errorMessage');

    // Verifica se o usuário existe no nosso "banco de dados"
    if (usuariosCadastrados[usuarioInput]) {
        const usuarioDados = usuariosCadastrados[usuarioInput];

        // Verifica se a senha está correta
        if (usuarioDados.senha === senhaInput) {
            erroDiv.style.display = 'none';
            alert('Login realizado com sucesso! Redirecionando...');
            window.location.href = usuarioDados.destino; // Redireciona o usuário
        } else {
            exibirErro("Senha incorreta!");
        }
    } else {
        exibirErro("Usuário não encontrado!");
    }
});

// Funçao para exibir mensagens de erro na tela
function exibirErro(mensagem) {
    const erroDiv = document.getElementById('errorMessage');
    erroDiv.innerText = mensaje;
    erroDiv.style.display = 'block';
}

// 3. Função do "Esqueci a senha" (Simulação por enquanto)
document.getElementById('forgotPassword').addEventListener('click', function(event) {
    event.preventDefault();
    
    const usuarioParaRecuperar = prompt("Digite o nome do usuário que deseja recuperar a senha:");
    
    if (!usuarioParaRecuperar) return;

    if (usuariosCadastrados[usuarioParaRecuperar]) {
        // Como não há servidor de e-mail ainda, mostramos na tela a dica/senha para ajudar o usuário
        alert(`Sistema Simulado:\nA senha do usuário "${usuarioParaRecuperar}" é: ${usuariosCadastrados[usuarioParaRecuperar].senha}`);
    } else {
        alert("Usuário não encontrado no sistema.");
    }
});
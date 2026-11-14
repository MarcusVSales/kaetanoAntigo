import Head from 'next/head';

export default function Politicas() {
  return (
    <>
      <Head>
        <title>Políticas — Kaetano Antigo</title>
        <meta name="description" content="Políticas de privacidade LGPD e políticas da loja Kaetano Antigo." />
      </Head>

      <section className="text-center py-14 bg-site-bg2 border-b border-site-border">
        <h1 className="section-title">Políticas</h1>
        <div className="section-divider" />
        <p className="text-site-text3 text-sm font-light mt-3">Privacidade, proteção de dados e regras da loja</p>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 space-y-20">

        {/* ── LGPD ──────────────────────────────────────────────────────────── */}
        <section aria-labelledby="lgpd-heading">
          <p className="text-xs tracking-[0.4em] uppercase text-site-text3 mb-3 font-medium">Seção 1</p>
          <h2 id="lgpd-heading" className="font-display text-3xl font-light text-black mb-2">
            Política de Privacidade e Proteção de Dados
          </h2>
          <div className="w-10 h-px bg-black mb-8" />

          <div className="space-y-6 text-sm text-site-text2 font-light leading-relaxed">

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">1. Quem somos</h3>
              <p>
                {/* ← EDITE AQUI */}
                O Kaetano Antigo é uma curadoria especializada em móveis e objetos das décadas de 40, 50 e 60.
                Adicione aqui os dados completos da sua empresa: razão social, CNPJ, endereço e e-mail de contato.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">2. Dados que coletamos</h3>
              <p>
                {/* ← EDITE AQUI */}
                Coletamos apenas os dados necessários para a realização das vendas e atendimento ao cliente,
                como nome, CPF/CNPJ e informações de contato fornecidas voluntariamente pelo comprador
                no momento da negociação.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">3. Como usamos seus dados</h3>
              <p>
                {/* ← EDITE AQUI */}
                Os dados coletados são utilizados exclusivamente para: emissão de recibos e comprovantes de venda,
                comunicação relacionada à compra e cumprimento de obrigações legais e fiscais.
                Não compartilhamos seus dados com terceiros para fins comerciais.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">4. Armazenamento e segurança</h3>
              <p>
                {/* ← EDITE AQUI */}
                Seus dados são armazenados de forma segura e acessados apenas pelo responsável da loja.
                Mantemos os registros pelo prazo exigido pela legislação fiscal e tributária brasileira.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">5. Seus direitos (LGPD — Lei 13.709/2018)</h3>
              <p>
                {/* ← EDITE AQUI */}
                Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
                confirmar a existência de tratamento dos seus dados, acessar seus dados, corrigir dados
                incompletos ou incorretos, solicitar a exclusão dos dados e revogar o consentimento a qualquer momento.
                Para exercer esses direitos, entre em contato conosco pelo WhatsApp.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">6. Cookies e estatísticas de visitas</h3>
              <p>
                Este site <strong>não utiliza cookies</strong> e não usa ferramentas de terceiros (como Google Analytics) para acompanhar visitantes.
                Para entender como o site é usado, registramos de forma <strong>anônima</strong>: quais páginas foram abertas, por quanto tempo,
                o endereço (domínio) do site de onde a pessoa veio e o tipo de aparelho (celular, tablet ou computador).
              </p>
              <p className="mt-3">
                Não gravamos endereço IP, nome, e-mail, telefone ou qualquer informação que identifique o visitante, e esses dados não são
                compartilhados com ninguém. Respeitamos a opção &ldquo;Não rastrear&rdquo; do seu navegador: com ela ativa, nada é registrado.
                Os registros são apagados automaticamente após 13 meses.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">7. Contato do encarregado (DPO)</h3>
              <p>
                {/* ← EDITE AQUI */}
                Para dúvidas sobre privacidade e proteção de dados, entre em contato pelo WhatsApp
                +55 11 96571-3610 ou pelo Instagram @kaetanoantigo.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">8. Atualizações desta política</h3>
              <p>
                {/* ← EDITE AQUI */}
                Esta política pode ser atualizada a qualquer momento. A versão mais recente estará
                sempre disponível nesta página.
                <br/>
                <span className="text-site-text3">Última atualização: {new Date().getFullYear()}.</span>
              </p>
            </div>

          </div>
        </section>

        {/* Divisória */}
        <div className="border-t border-site-border" />

        {/* ── Políticas da Loja ─────────────────────────────────────────────── */}
        <section aria-labelledby="loja-heading">
          <p className="text-xs tracking-[0.4em] uppercase text-site-text3 mb-3 font-medium">Seção 2</p>
          <h2 id="loja-heading" className="font-display text-3xl font-light text-black mb-2">
            Políticas da Loja
          </h2>
          <div className="w-10 h-px bg-black mb-8" />

          <div className="space-y-6 text-sm text-site-text2 font-light leading-relaxed">

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Peças e descrição</h3>
              <p>
                {/* ← EDITE AQUI */}
               Todas as peças do Kaetano Antigo são cuidadosamente selecionadas e avaliadas antes de integrarem nosso acervo. Buscamos apresentar descrições e fotografias fiéis às características, dimensões e ao estado de conservação de cada item. Por se tratarem de peças antigas e únicas, podem existir marcas naturais do tempo, que fazem parte de sua história e autenticidade.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Preços </h3>
              <p>
                {/* ← EDITE AQUI */}
              Os valores apresentados no site são válidos na data da consulta e estão sujeitos à atualização sem aviso prévio. Caso tenha dúvidas sobre uma peça ou sobre as condições de pagamento, nossa equipe terá prazer em atendê-lo pelo WhatsApp.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Formas de Pagamento</h3>
              <p>
                {/* ← EDITE AQUI */}
                Aceitamos PIX, dinheiro, transferência bancária, cartões de débito e crédito. O pagamento deverá ser confirmado antes da retirada ou do envio da peça. Para pagamentos parcelados, consulte as condições diretamente conosco.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Retirada e Entrega</h3>
              <p>
                {/* ← EDITE AQUI */}
                As peças podem ser retiradas em nosso espaço mediante agendamento prévio. Também realizamos envios por meio de transportadoras especializadas em mobiliário, visando garantir o transporte adequado de cada peça.   
                O valor do frete é calculado individualmente e varia de acordo com o porte da peça, a complexidade do transporte e o destino da entrega. O orçamento é informado previamente para aprovação do cliente
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Trocas e Devoluções</h3>
              <p>
                {/* ← EDITE AQUI */}
                Por se tratarem de peças únicas e, em sua maioria, antigas, recomendamos que todas as informações, medidas e fotografias sejam analisadas antes da compra. Em vendas presenciais, não realizamos trocas ou devoluções após a conclusão da venda. Nas vendas realizadas à distância, aplicam-se os direitos previstos na legislação brasileira, quando cabíveis.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Reserva de Peças</h3>
              <p>
                {/* ← EDITE AQUI */}
             Reservamos peças mediante pagamento de sinal previamente acordado. O período de reserva e as condições serão informados no momento da negociação.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Restauro</h3>
              <p>
                {/* ← EDITE AQUI */}
                Oferecemos orçamento para serviços de restauro em peças adquiridas conosco e, mediante avaliação, também em peças trazidas pelo cliente.{' '}
                <a href="/restauro" className="underline hover:text-black transition-colors">Restauro</a>
                {' '}para mais informações.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-black text-xs tracking-widest uppercase mb-2">Atendimento</h3>
              <p>
                {/* ← EDITE AQUI */}
               Segunda a sexta-feira, das 9h às 17h, e aos sábados, das 9h às 15h. Não realizamos atendimento aos domingos e feriados. As mensagens recebidas fora do horário comercial serão respondidas no próximo dia útil.
              </p>
            </div>

          </div>
        </section>

        {/* Nota de rodapé */}
        

      </div>
    </>
  );
}
// arquivo completo acima

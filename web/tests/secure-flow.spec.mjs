import {test,expect} from "@playwright/test";

async function enter(page,email="cliente@rfbagent.invalid"){
 await page.goto("/");
 await expect(page.getByRole("heading",{name:"Entrar no workspace"})).toBeVisible();
 await page.locator('input[type="email"]').fill(email);
 await page.locator('input[type="password"]').fill("SenhaDemo123!");
 await page.getByRole("button",{name:"Entrar",exact:true}).click();
 await expect(page.getByRole("heading",{name:"Conversas"})).toBeVisible();
}
test("cliente autenticado: conversa persistente e proposta sem reserva",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await enter(page);
 await page.getByRole("button",{name:"Nova conversa"}).click();
 await expect(page.getByText(/Nova conversa criada/)).toBeVisible();
 await page.locator("#reply").fill("Qual o horário de atendimento?");
 await page.getByRole("button",{name:"Enviar",exact:true}).click();
 await expect(page.getByText("Qual o horário de atendimento?")).toBeVisible();
 await page.getByRole("button",{name:"Solicitar humano"}).click();
 await expect(page.getByText(/Transferência humana registrada no ambiente de teste/)).toBeVisible();
 await page.reload();
 await expect(page.getByRole("heading",{name:"Conversas"})).toBeVisible();
 await page.getByRole("button",{name:"Agendamentos"}).click();
 await expect(page.getByText("Confirmar reserva real — indisponível")).toBeVisible();
 await expect(page.getByText(/O gateway autorizado de teste garante um agendamento/)).toBeVisible();
 await expect(page.getByRole("button",{name:"Confirmar reserva real — indisponível"})).toBeDisabled();
 await page.screenshot({path:"test-results/emulator-customer.png",fullPage:true});
});
test("gestor vê equipe, cria documento e cliente não vê informação interna",async({page})=>{
 await enter(page,"gestor@rfbagent.invalid");
 await page.getByRole("button",{name:"Fila humana"}).click();
 await expect(page.getByText("Fila de atendimentos humanos")).toBeVisible();
 await page.getByRole("button",{name:"Marcar resolvido"}).first().click();
 await expect(page.getByText(/Atendimento resolvido e auditado/)).toBeVisible();
 await page.getByRole("button",{name:"Equipe"}).click();
 await expect(page.getByText("managerA")).toBeVisible();
 await page.getByRole("button",{name:"Auditoria"}).click();
 await expect(page.getByText("Eventos e trilha de auditoria (Emulator)")).toBeVisible();
 await page.getByRole("button",{name:"Conhecimento"}).click();
 await page.getByText("Procedimento interno").waitFor();
 await page.locator('input[maxlength="120"]').fill("Novo procedimento externo");
 await page.locator('textarea[maxlength="10000"]').fill("Conteúdo de teste acessível, versionado e autorizável.");
 await page.getByRole("button",{name:"Salvar versão 1"}).click();
 await expect(page.getByText("Novo procedimento externo")).toBeVisible();
 await page.locator(".doc").filter({hasText:"Novo procedimento externo"}).getByRole("button",{name:"Editar fonte"}).click();
 await page.locator('textarea[maxlength="10000"]').fill("Conteúdo atualizado sob controle de versão.");
 await page.getByRole("button",{name:/Salvar versão 2/}).click();
 await expect(page.getByText("Conteúdo atualizado sob controle de versão.")).toBeVisible();
 await page.screenshot({path:"test-results/emulator-manager.png",fullPage:true});
});
test("membro não obtém acesso ao trocar de empresa",async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await enter(page);
 await page.getByRole("button",{name:"Configurações"}).click();
 await page.getByRole("textbox",{name:"Trocar empresa"}).fill("beta");
 await expect(page.getByRole("heading",{name:"Sem permissão nesta empresa"})).toBeVisible();
 await page.screenshot({path:"test-results/emulator-blocked-mobile.png",fullPage:true});
});

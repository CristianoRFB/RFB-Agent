import {test,expect} from "@playwright/test";

test("fluxo desktop: pergunta com fonte, proposta e confirmação separadas, reload e auditoria", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Central de atendimento"})).toBeVisible();
  await expect(page.getByText("Ambiente demonstrativo.")).toBeVisible();
  await expect(page.locator("#count")).toHaveText("00");

  await page.locator("#question").fill("Qual o horário de atendimento?");
  await page.getByRole("button",{name:/Enviar/}).click();
  await expect(page.getByText(/Conforme a base de conhecimento:/)).toBeVisible();
  await expect(page.getByText(/Fonte: Horários de atendimento/)).toBeVisible();
  await expect(page.locator("#count")).toHaveText("00");

  await page.getByRole("button",{name:"Criar proposta"}).click();
  await expect(page.getByText("Confirmação explícita necessária")).toBeVisible();
  await expect(page.locator("#count")).toHaveText("00");

  await page.getByRole("button",{name:"Confirmar"}).click();
  await expect(page.locator("#count")).toHaveText("01");
  await expect(page.getByText(/Agendamento SIMULADO confirmado/)).toBeVisible();
  await page.reload();
  await expect(page.locator("#count")).toHaveText("01");
  await page.getByRole("button",{name:/Auditoria/}).click();
  await expect(page.getByText("RESERVA SIMULADA CONFIRMADA")).toBeVisible();

  await page.screenshot({path:"test-results/rfbagent-desktop.png",fullPage:true});
  await page.locator("#reset").click();
  await expect(page.locator("#count")).toHaveText("00");
});

test("mobile 390px: interface e busca, entrada não vira HTML ou ação", async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await expect(page.getByRole("heading",{name:"Central de atendimento"})).toBeVisible();
  await expect(page.getByRole("button",{name:/Conhecimento/})).toBeVisible();
  await page.locator("#question").fill("<img src=x onerror=alert(1)>");
  await page.getByRole("button",{name:/Enviar/}).click();
  await expect(page.locator("#messages img")).toHaveCount(0);
  await expect(page.locator("#count")).toHaveText("00");
  await page.getByRole("button",{name:/Conhecimento/}).click();
  await expect(page.getByText("Fontes versionadas")).toBeVisible();
  await page.screenshot({path:"test-results/rfbagent-mobile.png",fullPage:true});
});

test("teclado: link de pular e foco de formulário", async ({page}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip")).toBeFocused();
  await page.locator("#question").focus();
  await expect(page.locator("#question")).toBeFocused();
});

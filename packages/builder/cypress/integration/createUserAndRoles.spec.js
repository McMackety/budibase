import filterTests from "../support/filterTests"
const interact = require('../support/interact')

filterTests(["smoke", "all"], () => {
  context("Create a User and Assign Roles", () => {
    before(() => {
      cy.login()
      cy.deleteApp("Cypress Tests")
      cy.createApp("Cypress Tests")
    })

    it("should create a user", () => {
      cy.visit(`${Cypress.config().baseUrl}/builder`)
      cy.wait(1000)
      cy.createUser("bbuser@test.com")
      cy.get(interact.SPECTRUM_TABLE).should("contain", "bbuser")
    })

    it("should confirm there is No Access for a New User", () => {
      // Click into the user
      cy.contains("bbuser").click()
      cy.wait(500)
      // Get No Access table - Confirm it has apps in it
      cy.get(interact.SPECTRUM_TABLE).eq(1).should("not.contain", "No rows found")
      // Get Configure Roles table - Confirm it has no apps
      cy.get(interact.SPECTRUM_TABLE).eq(0).contains("No rows found")
    })

    if (Cypress.env("TEST_ENV")) {
      it("should assign role types", () => {
        // 3 apps minimum required - to assign an app to each role type
        cy.request(`${Cypress.config().baseUrl}/api/applications?status=all`)
          .its("body")
          .then(val => {
            if (val.length < 3) {
              for (let i = 1; i < 3; i++) {
                const uuid = () => Cypress._.random(0, 1e6)
                const name = uuid()
                if(i < 1){
                  cy.createApp(name)
                } else {
                  cy.visit(`${Cypress.config().baseUrl}/builder`)
                  cy.wait(500)
                  cy.get(interact.CREATE_APP_BUTTON).click({ force: true })
                  cy.createAppFromScratch(name)
                }
              }
            }
          })
        // Navigate back to the user
        cy.visit(`${Cypress.config().baseUrl}/builder`)
        cy.wait(500)
        cy.get(interact.SPECTRUM_SIDENAV).contains("Users").click()
        cy.wait(500)
        cy.get(interact.SPECTRUM_TABLE).contains("bbuser").click()
        cy.wait(1000)
        for (let i = 0; i < 3; i++) {
          cy.get(interact.SPECTRUM_TABLE, { timeout: 3000})
            .eq(1)
            .find(interact.SPECTRUM_TABLE_ROW)
            .eq(0)
            .find(interact.SPECTRUM_TABLE_CELL)
            .eq(0)
            .click()
          cy.wait(500)
          cy.get(interact.SPECTRUM_DIALOG_GRID)
            .contains("Choose an option")
            .click()
            .then(() => {
              cy.wait(1000)
              if (i == 0) {
                cy.get(interact.SPECTRUM_MENU).contains("Admin").click({ force: true })
              }
              else if (i == 1) {
                cy.get(interact.SPECTRUM_MENU).contains("Power").click({ force: true })
              }
              else if (i == 2) {
                cy.get(interact.SPECTRUM_MENU).contains("Basic").click({ force: true })
              }
              cy.wait(1000)
              cy.get(interact.SPECTRUM_BUTTON)
                .contains("Update role")
                .click({ force: true })
            })
            cy.reload()
        }
        // Confirm roles exist within Configure roles table
        cy.wait(2000)
        cy.get(interact.SPECTRUM_TABLE)
          .eq(0)
          .within(assginedRoles => {
            expect(assginedRoles).to.contain("Admin")
            expect(assginedRoles).to.contain("Power")
            expect(assginedRoles).to.contain("Basic")
          })
      })
  
      it("should unassign role types", () => {
        // Set each app within Configure roles table to 'No Access'
        cy.get(interact.SPECTRUM_TABLE)
          .eq(0)
          .find(interact.SPECTRUM_TABLE_ROW)
          .its("length")
          .then(len => {
            for (let i = 0; i < len; i++) {
              cy.get(interact.SPECTRUM_TABLE)
                .eq(0)
                .find(interact.SPECTRUM_TABLE_ROW)
                .eq(0)
                .find(interact.SPECTRUM_TABLE_CELL)
                .eq(0)
                .click()
                .then(() => {
                  cy.get(interact.SPECTRUM_PICKER).eq(1).click({ force: true })
                  cy.wait(500)
                  cy.get(interact.SPECTRUM_POPOVER).contains("No Access").click()
                })
              cy.get(interact.SPECTRUM_BUTTON)
                .contains("Update role")
                .click({ force: true })
              cy.wait(1000)
            }
          })
        // Confirm Configure roles table no longer has any apps in it
        cy.get(interact.SPECTRUM_TABLE).eq(0).contains("No rows found")
      })
    }

    it("should enable Developer access", () => {
      // Enable Developer access
      cy.get(interact.FIELD)
        .eq(4)
        .within(() => {
          cy.get(interact.SPECTRUM_SWITCH_INPUT).click({ force: true })
        })
      // No Access table should now be empty
      cy.get(interact.CONTAINER)
        .contains("No Access")
        .parent()
        .within(() => {
          cy.get(interact.SPECTRUM_TABLE).contains("No rows found")
        })

      // Each app within Configure roles should have Admin access
      cy.get(interact.SPECTRUM_TABLE)
        .eq(0)
        .find(interact.SPECTRUM_TABLE_ROW)
        .its("length")
        .then(len => {
          for (let i = 0; i < len; i++) {
            cy.get(interact.SPECTRUM_TABLE)
              .eq(0)
              .find(interact.SPECTRUM_TABLE_ROW)
              .eq(i)
              .contains("Admin")
            cy.wait(500)
          }
        })
    })

    it("should disable Developer access", () => {
      // Disable Developer access
      cy.get(".field")
        .eq(4)
        .within(() => {
          cy.get(".spectrum-Switch-input").click({ force: true })
        })
      // Configure roles table should now be empty
      cy.get(".container")
        .contains("Configure roles")
        .parent()
        .within(() => {
          cy.get(interact.SPECTRUM_TABLE).contains("No rows found")
        })
    })

    it("should delete a user", () => {
      // Click Delete user button
      cy.get(interact.SPECTRUM_BUTTON)
        .contains("Delete user")
        .click({ force: true })
        .then(() => {
          // Confirm deletion within modal
          cy.wait(500)
          cy.get(interact.SPECTRUM_DIALOG_GRID).within(() => {
            cy.get(interact.SPECTRUM_BUTTON)
              .contains("Delete user")
              .click({ force: true })
            cy.wait(4000)
          })
        })
      cy.get(interact.SPECTRUM_TABLE).should("not.have.text", "bbuser")
    })
  })
})

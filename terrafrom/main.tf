locals {
  name = "rag"
  location = "southeastasia"
}

resource "azurerm_resource_group" "rg" {
  name     = "${local.name}-rg"
  location = local.location
}

# random string 
resource "random_string" "random" {
  length  = 8
  special = false
  upper   = false
}

resource "azurerm_storage_account" "sa" {
  name                     = "st${local.name}${random_string.random.result}"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

# create a container in the storage account
resource "azurerm_storage_container" "container" {
  name                  = "rag-container"
  storage_account_name  = azurerm_storage_account.sa.name
  container_access_type = "private"
}




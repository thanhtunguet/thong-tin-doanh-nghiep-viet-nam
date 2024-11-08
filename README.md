# TTDN Backend API

This repository contains the backend API for TTDN, with endpoints to manage company data, location divisions, and other resources. This documentation explains how to call each API endpoint.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
  - [Crawler API](#crawler-api)
  - [Proxy API](#proxy-api)
  - [Division API](#division-api)
  - [OpenAI API](#openai-api)
  - [Company API](#company-api)

---

## Overview

The TTDN backend API allows clients to interact with various data, such as:
- Crawling data based on province and page.
- Proxy synchronization and retrieval.
- Geographical division data (provinces, districts, wards).
- Accessing company information by province, tax code, or specific ID.

## Setup

To get started, clone this repository and install dependencies.

```bash
git clone <repo_url>
cd ttdn-backend
npm install
```

Run the application:

```bash
npm start
```

---

## API Endpoints

### Crawler API

1. **Crawl a specific page in a province**
   - **Endpoint**: `GET /api/crawler/{province}/trang-{page}`
   - **Parameters**:
     - `province` (path, required): The province to crawl.
     - `page` (path, required): The page number to crawl.
   - **Description**: Retrieves data for a specific province page.
   - **Example**: `/api/crawler/Bac-Ninh/trang-2`

2. **Crawl the first page in a province**
   - **Endpoint**: `GET /api/crawler/{province}`
   - **Parameters**:
     - `province` (path, required): The province to crawl.
   - **Description**: Retrieves data for the first page of a specific province.
   - **Example**: `/api/crawler/Bac-Ninh`

---

### Proxy API

1. **Synchronize Address**
   - **Endpoint**: `GET /proxy/sync-address`
   - **Description**: Synchronizes proxy addresses.

2. **Synchronize Source Code**
   - **Endpoint**: `GET /proxy/sync-source-code`
   - **Description**: Synchronizes source code for proxy.

3. **Retrieve Province Groups**
   - **Endpoint**: `GET /proxy/province-groups`
   - **Description**: Retrieves a list of grouped provinces.

---

### Division API

1. **List Provinces**
   - **Endpoint**: `GET /api/division/provinces`
   - **Parameters**:
     - `skip` (query, optional): Number of records to skip.
     - `take` (query, optional): Number of records to retrieve.
   - **Description**: Retrieves a list of provinces.

2. **List Districts**
   - **Endpoint**: `GET /api/division/districts`
   - **Parameters**:
     - `skip` (query, optional): Number of records to skip.
     - `take` (query, optional): Number of records to retrieve.
   - **Description**: Retrieves a list of districts.

3. **List Wards**
   - **Endpoint**: `GET /api/division/wards`
   - **Parameters**:
     - `skip` (query, optional): Number of records to skip.
     - `take` (query, optional): Number of records to retrieve.
   - **Description**: Retrieves a list of wards.

---

### OpenAI API

1. **Format Address**
   - **Endpoint**: `POST /api/openai/format-address`
   - **Request Body**:
     - `prompt` (string, required): The prompt for OpenAI to format the address.
   - **Description**: Uses OpenAI to format an address based on the provided prompt.
   - **Example Request Body**:
     ```json
     {
       "prompt": "Format this address"
     }
     ```

---

### Company API

1. **List Companies**
   - **Endpoint**: `GET /api/company`
   - **Description**: Retrieves a list of companies.

2. **Count Companies**
   - **Endpoint**: `GET /api/company/count`
   - **Description**: Retrieves the count of companies.

3. **Count Companies by Province**
   - **Endpoint**: `GET /api/company/provinces/count`
   - **Parameters**:
     - `provinceId` (path, required): The ID of the province.
     - `skip` (query, optional): Number of records to skip.
     - `take` (query, optional): Number of records to retrieve.
   - **Description**: Retrieves the count of companies in a specific province.

4. **Search Companies by Province**
   - **Endpoint**: `GET /api/company/provinces/{provinceId}`
   - **Parameters**:
     - `provinceId` (path, required): The ID of the province.
     - `skip` (query, optional): Number of records to skip.
     - `take` (query, optional): Number of records to retrieve.
   - **Description**: Searches for companies within a specified province.

5. **Search Company by Tax Code**
   - **Endpoint**: `GET /api/company/tax-code/{taxCode}`
   - **Parameters**:
     - `taxCode` (path, required): The tax code of the company.
   - **Description**: Retrieves company details based on a tax code.

6. **Get Company by ID**
   - **Endpoint**: `GET /api/company/{id}`
   - **Parameters**:
     - `id` (path, required): The unique identifier of the company.
   - **Description**: Retrieves company information by ID.

---

## Response Format

All endpoints return responses in JSON format. Specific response fields depend on the endpoint and its purpose.

---

## Contact

For further questions or issues, please reach out to the project maintainers.

---

This README file provides a complete guide to calling each API endpoint in the TTDN backend. For additional details or complex queries, refer to the full Swagger documentation if available.

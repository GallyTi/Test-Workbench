# RITS Graph Workbench – Full Application Blueprint

## 0. Purpose

This document defines a full blueprint for building **RITS Graph Workbench**: a custom internal application for mapping systems, processes, interfaces, payloads, documentation, tests, GAPs, owners and connectivity paths in a single editable knowledge graph.

The application should not be a static documentation tool. It should be a **source-of-truth data model** that can generate documentation, maps, exports, test cases and traceability views.

Target use cases:

- Map RITS/HIVE2 systems, processes, interfaces and data flows.
- Search and visualize connectivity paths between objects, e.g. `DOMS -> SSR`, `POS -> SAP CAR`, `SAP PO -> SAP IS-Oil`.
- Maintain WET / DSC / SO / OCI / IMM / FIN views.
- Import/export data through Excel, CSV, JSON and later SharePoint connector.
- Generate documentation pages from structured data.
- Generate test cases from processes/interfaces/paths.
- Track change requests, manual reviews, decisions and ownership.
- Provide a simple UI so non-technical users can edit objects and relationships without touching code.

---

## 1. Product Vision

**RITS Graph Workbench** is a custom Jira/Confluence/architecture-map replacement tailored for RITS/HIVE2.

It combines:

- architecture repository,
- graph explorer,
- interface catalogue,
- process catalogue,
- generated documentation,
- test repository,
- GAP/decision tracking,
- lightweight change workflow,
- import/export workbench.

The key principle:

> Documentation is not manually maintained as the source of truth. Documentation is generated from the underlying graph data model.

---

## 2. Core Principles

### 2.1 Model-first

The application must be built around a universal object and relationship model.

Do not start from diagrams, pages or screenshots.

Start from:

```text
objects + relationships + metadata + versions
```

Everything else is generated from this:

```text
graph views
documentation pages
test cases
traceability matrices
exports
```

### 2.2 SharePoint-later

SharePoint should not be the core database in the first version.

Recommended approach:

```text
Core database first
SharePoint connector later
```

SharePoint can be added later as:

- import source,
- export target,
- publishing channel,
- connector to existing HIVE2 lists.

### 2.3 Robust but modular

Build a robust architecture from the beginning, but implement features incrementally.

Do not create a throwaway prototype with a weak data model.

### 2.4 Editable by humans

The app must support multiple edit modes:

1. visual graph editor,
2. table editor,
3. object detail forms,
4. Excel/CSV/JSON import,
5. later SharePoint sync.

### 2.5 Every change is traceable

Any modification to a process, system, interface or relationship should be versioned and auditable.

---

## 3. Recommended Technology Stack

### 3.1 Frontend

Recommended:

```text
Next.js
TypeScript
shadcn/ui
Tailwind CSS
React Flow
TanStack Table
Zustand or Redux Toolkit
Monaco Editor for JSON/YAML editing
```

Purpose:

- Next.js: main web application.
- shadcn/ui: clean enterprise UI components.
- React Flow: primary 2D graph editor.
- TanStack Table: Excel-like table editing.
- Monaco Editor: raw JSON/YAML workspace editor.

### 3.2 Backend

Recommended options:

```text
NestJS + TypeScript
or
FastAPI + Python
```

Preferred for TypeScript consistency:

```text
NestJS
```

Backend responsibilities:

- REST/GraphQL API,
- authentication hooks,
- object CRUD,
- relationship CRUD,
- import/export,
- validation,
- documentation generation,
- test generation,
- pathfinding,
- versioning,
- change workflow.

### 3.3 Database

Primary source of truth:

```text
PostgreSQL
```

Optional graph projection/index:

```text
Neo4j
```

Recommended rule:

```text
PostgreSQL = master data source
Neo4j = optional graph query/index layer
```

Do not make Neo4j the only source of truth at the beginning, because the application also needs classic entities such as users, versions, change requests, tests, statuses, documents and audit logs.

### 3.4 Deployment

Recommended:

```text
Docker Compose on Ubuntu
Caddy or Nginx reverse proxy
HTTPS
PostgreSQL volume backup
optional Neo4j volume backup
```

For personal/demo deployment:

```text
projectuntold.eu
```

Use only:

- demo data,
- anonymized data,
- synthetic RITS-like data.

Do not put real internal company data on a personal/external server without approval.

---

## 4. High-Level Architecture

```text
Browser
  ↓
Next.js / shadcn UI
  ↓
API Backend
  ↓
PostgreSQL source of truth
  ↓
Graph/pathfinding service
  ↓
Optional Neo4j projection
  ↓
Exporters / generators
  ↓
XLSX / CSV / JSON / Markdown / DOCX / SVG / PNG
```

### 4.1 Adapter Layer

The application must include an adapter layer so the core model does not depend on any single import source.

Adapters:

```text
Excel adapter
CSV adapter
JSON adapter
YAML adapter
SharePoint adapter later
Markdown export adapter
DOCX export adapter
Neo4j projection adapter
```

All imported data must be normalized into:

```text
objects
relationships
interfaces
processes
payloads
tests
documents
views
change_requests
```

---

## 5. Main Application Modules

### 5.1 Object Repository

Stores all entities.

Examples:

- system,
- application,
- interface,
- process,
- payload,
- IDoc,
- table,
- database,
- service,
- person,
- role,
- document,
- GAP,
- test case,
- requirement,
- decision,
- change request.

### 5.2 Relationship Repository

Stores all relationships between objects.

Examples:

- communicates_with,
- sends_to,
- receives_from,
- uses,
- contains,
- belongs_to,
- owned_by,
- tested_by,
- documented_in,
- has_payload,
- has_gap,
- has_test_case,
- depends_on,
- impacts,
- validates,
- replaces,
- maps_to.

### 5.3 Graph Explorer

Interactive map with:

- 2D graph,
- optional 3D constellation mode,
- expand/collapse,
- depth control,
- filters,
- path search,
- node detail panel,
- edge detail panel,
- saved views.

### 5.4 Documentation Generator

Generates documentation pages from objects and relationships.

Pages must not be manually written as the main source of truth.

### 5.5 Test Generator

Generates test cases from:

- process,
- interface,
- payload,
- source system,
- target system,
- selected path.

### 5.6 Import/Export Workbench

Supports:

- Excel import,
- CSV import,
- JSON import,
- validation preview,
- change preview,
- export to Excel,
- export to Markdown,
- export to DOCX,
- export graph as SVG/PNG.

### 5.7 Change Workflow

Lightweight Jira-like workflow, but linked to graph objects.

States:

```text
Draft
In Review
Approved
Published
Rejected
Deprecated
```

### 5.8 Validation Engine

Detects data quality issues.

Examples:

- object without type,
- relationship without source,
- relationship without target,
- interface without source system,
- interface without target system,
- process without related interface,
- payload without interface,
- test without linked object,
- duplicate interface ID,
- orphan node,
- circular dependency,
- invalid domain,
- invalid communication type,
- missing owner,
- manual review required.

---

## 6. Data Model

### 6.1 Table: `objects`

Purpose: universal entity table.

```sql
CREATE TABLE objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    object_type TEXT NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT,
    domain TEXT,
    subdomain TEXT,
    country TEXT,
    status TEXT DEFAULT 'draft',
    criticality TEXT,
    description TEXT,
    owner_object_id TEXT,
    source_ref TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

Allowed `object_type` values:

```text
system
application
interface
process
payload
idoc
table
database
service
person
role
document
gap
test_case
requirement
decision
change_request
view
country
domain
```

Recommended `domain` values:

```text
WET
DSC
SO
OCI
IMM
FIN
POS
Integration
Reporting
MasterData
External
```

Recommended `status` values:

```text
draft
manual_review
confirmed
approved
published
deprecated
rejected
```

---

### 6.2 Table: `relationships`

Purpose: all graph edges.

```sql
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    relationship_id TEXT UNIQUE NOT NULL,
    source_object_id TEXT NOT NULL,
    target_object_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    direction TEXT DEFAULT 'directed',
    communication_type TEXT,
    data_type TEXT,
    payload_type TEXT,
    interface_code TEXT,
    status TEXT DEFAULT 'draft',
    confidence TEXT DEFAULT 'unknown',
    description TEXT,
    source_ref TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_rel_source FOREIGN KEY (source_object_id) REFERENCES objects(object_id),
    CONSTRAINT fk_rel_target FOREIGN KEY (target_object_id) REFERENCES objects(object_id)
);
```

Allowed `relationship_type` values:

```text
communicates_with
sends_to
receives_from
uses
contains
belongs_to
owned_by
tested_by
documented_in
has_payload
has_gap
has_test_case
depends_on
impacts
validates
replaces
maps_to
implemented_by
approved_by
```

Allowed `communication_type` values:

```text
SAP_PO
EAI
MuleSoft
Direct_API
REST_API
SOAP
IDoc
File
SQL
WEB
RabbitMQ
Kafka
Manual
Unknown
```

Allowed `data_type` values:

```text
master_data
transactional_data
configuration_data
reporting_data
technical_data
mixed
unknown
```

Allowed `payload_type` values:

```text
IDoc
XML
JSON
CSV
XLSX
DB_TABLE
API_OBJECT
FILE
MESSAGE
Unknown
```

---

### 6.3 Table: `interfaces`

Purpose: interface-specific details.

```sql
CREATE TABLE interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    interface_code TEXT UNIQUE NOT NULL,
    source_system_id TEXT,
    target_system_id TEXT,
    middleware TEXT,
    communication_type TEXT,
    direction TEXT,
    data_type TEXT,
    frequency TEXT,
    payload_type TEXT,
    message_format TEXT,
    business_object TEXT,
    country TEXT,
    domain TEXT,
    status TEXT DEFAULT 'draft',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_interface_object FOREIGN KEY (object_id) REFERENCES objects(object_id)
);
```

Recommended interface code pattern:

```text
IF_RITS_001
IF_RITS_002
IF_RITS_003
...
```

---

### 6.4 Table: `processes`

```sql
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    process_code TEXT UNIQUE,
    process_name TEXT NOT NULL,
    process_level TEXT,
    parent_process_id TEXT,
    domain TEXT,
    country TEXT,
    description TEXT,
    gap_relevance TEXT DEFAULT 'unknown',
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_process_object FOREIGN KEY (object_id) REFERENCES objects(object_id)
);
```

Process levels:

```text
L0
L1
L2
L3
L4
L5
```

---

### 6.5 Table: `payloads`

```sql
CREATE TABLE payloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    payload_code TEXT UNIQUE,
    interface_code TEXT,
    payload_name TEXT NOT NULL,
    payload_type TEXT,
    business_object TEXT,
    format TEXT,
    schema_ref TEXT,
    sample_content TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_payload_object FOREIGN KEY (object_id) REFERENCES objects(object_id)
);
```

Examples:

```text
ORDERS05
ADRMAS
CREMAS
DEBMAS
COGRP6
COSMAS
COELEM
GLMAST
```

Only mark such payloads as confirmed when supported by source data.

---

### 6.6 Table: `tests`

```sql
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    test_code TEXT UNIQUE NOT NULL,
    test_name TEXT NOT NULL,
    test_type TEXT,
    related_process_id TEXT,
    related_interface_code TEXT,
    source_system_id TEXT,
    target_system_id TEXT,
    preconditions TEXT,
    steps JSONB,
    expected_result TEXT,
    test_data TEXT,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_test_object FOREIGN KEY (object_id) REFERENCES objects(object_id)
);
```

Allowed `test_type` values:

```text
connectivity_test
interface_mapping_test
payload_validation_test
end_to_end_process_test
negative_test
regression_test
country_specific_test
authorization_test
reporting_validation_test
migration_test
cutover_test
```

---

### 6.7 Table: `documents`

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT UNIQUE NOT NULL,
    document_code TEXT UNIQUE,
    title TEXT NOT NULL,
    document_type TEXT,
    url TEXT,
    source TEXT,
    version TEXT,
    summary TEXT,
    generated BOOLEAN DEFAULT false,
    generated_content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    CONSTRAINT fk_document_object FOREIGN KEY (object_id) REFERENCES objects(object_id)
);
```

Document types:

```text
architecture
integration_spec
functional_spec
technical_spec
process_description
test_document
gap_document
decision_log
meeting_notes
source_file
```

---

### 6.8 Table: `change_requests`

```sql
CREATE TABLE change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cr_code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    change_type TEXT,
    affected_object_id TEXT,
    status TEXT DEFAULT 'draft',
    priority TEXT,
    requested_by TEXT,
    reviewed_by TEXT,
    decision TEXT,
    decision_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

Change types:

```text
architecture_change
interface_change
process_change
mapping_change
test_gap
documentation_gap
data_quality_issue
hive2_impact
manual_review
decision
```

---

### 6.9 Table: `object_versions`

```sql
CREATE TABLE object_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    change_type TEXT,
    changed_by TEXT,
    changed_at TIMESTAMP DEFAULT now(),
    change_summary TEXT,
    snapshot_json JSONB NOT NULL
);
```

---

### 6.10 Table: `views`

```sql
CREATE TABLE views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    view_id TEXT UNIQUE NOT NULL,
    view_name TEXT NOT NULL,
    view_type TEXT,
    root_object_id TEXT,
    filter_expression JSONB,
    layout TEXT DEFAULT 'force',
    depth INTEGER DEFAULT 2,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

View types:

```text
architecture_overview
domain_map
system_map
interface_map
process_map
path_view
test_coverage_map
gap_impact_map
ownership_map
manual_review_map
```

---

## 7. Query Language

The application should support a simple business-friendly query syntax.

### 7.1 Examples

```text
path DOMS -> SSR
path POS -> SAP CAR
show WET
show DSC
show IF_RITS_09*
show around SAP PO depth 2
show communication_type SAP_PO
show data_type master_data
show process Delivery Confirmation
show gaps without tests
show interfaces without owner
generate tests for IF_RITS_009
generate tests for path DOMS -> SSR
export documentation for WET
```

### 7.2 Query parser output

Each query should be parsed into a structured command.

Example:

Input:

```text
path DOMS -> SSR
```

Parsed:

```json
{
  "type": "path",
  "source": "DOMS",
  "target": "SSR",
  "mode": "shortest"
}
```

Input:

```text
show around SAP PO depth 2
```

Parsed:

```json
{
  "type": "neighborhood",
  "center": "SAP PO",
  "depth": 2
}
```

Input:

```text
show IF_RITS_09*
```

Parsed:

```json
{
  "type": "search",
  "pattern": "IF_RITS_09*",
  "match_mode": "wildcard"
}
```

---

## 8. Pathfinding Logic

### 8.1 Basic shortest path

The first version can implement pathfinding in the backend using relationships from PostgreSQL.

Pseudo-code:

```ts
function findShortestPath(sourceObjectId, targetObjectId, filters) {
  const graph = loadRelationships(filters);
  return breadthFirstSearch(graph, sourceObjectId, targetObjectId);
}
```

### 8.2 Filtered path

Supported filters:

```text
domain
country
communication_type
data_type
status
relationship_type
object_type
```

Example:

```text
path DOMS -> SSR where domain = WET and status in confirmed,approved
```

### 8.3 Neighborhood query

```text
show around SAP PO depth 2
```

Algorithm:

```text
1. Resolve node by label/object_id.
2. Load all incoming/outgoing relationships.
3. Traverse up to selected depth.
4. Return subgraph.
```

---

## 9. UI Layout

### 9.1 Main layout

```text
┌─────────────────────────────────────────────────────────────┐
│ Global Search / Query Bar                                   │
├───────────────┬─────────────────────────────┬───────────────┤
│ Explorer      │ Main Workspace              │ Detail Panel   │
│               │                             │               │
│ Architecture  │ Graph View                  │ Metadata       │
│ Domains       │ Documentation View          │ Relations      │
│ Systems       │ Table Editor                │ Tests          │
│ Interfaces    │ Test View                   │ GAPs           │
│ Processes     │ Import/Export               │ Documents      │
│ Tests         │                             │ Owners         │
│ GAPs          │                             │ Validation     │
└───────────────┴─────────────────────────────┴───────────────┘
```

### 9.2 Main modes

```text
Map mode
Documentation mode
Table mode
Import/export mode
Test mode
Validation mode
Admin mode
```

### 9.3 Left explorer

Tree structure:

```text
Architecture
 ├─ WET
 ├─ DSC
 ├─ SO
 ├─ OCI
 ├─ IMM
 ├─ FIN
 ├─ Systems
 ├─ Interfaces
 ├─ Processes
 ├─ Payloads
 ├─ Tests
 ├─ GAPs
 ├─ Documents
 ├─ People
 └─ Manual Review
```

### 9.4 Center graph

Primary graph renderer: React Flow.

Requirements:

- dark background,
- simple white/gray nodes,
- subtle edges,
- zoom/pan,
- expand/collapse,
- node drag,
- edge creation,
- path highlight,
- selected node highlight,
- invalid node marker,
- manual review marker,
- GAP impact marker.

### 9.5 Right detail panel

For selected object:

```text
Header
Object metadata
Description
Relationships
Related interfaces
Related processes
Related payloads
Related tests
Related GAPs
Related documents
Owners / SMEs
Validation warnings
Change history
Actions
```

Actions:

```text
Edit
Add relationship
Generate documentation
Generate tests
Export object
Create change request
Mark as manual review
Approve
Publish
```

---

## 10. Graph Visual Design

### 10.1 Node shapes

```text
system = cube / rounded rectangle
process = circle
interface = small diamond / link icon
payload = document icon
database = cylinder
table = grid icon
person = user icon
test = checklist icon
gap = warning icon
document = page icon
decision = flag icon
```

### 10.2 Colors

Dark theme default:

```text
background = #050505
node default = #f5f5f5
node text = #ffffff
edge default = #6b7280
selected = #38bdf8
manual review = #facc15
GAP impact = #ef4444
approved = #22c55e
draft = #94a3b8
deprecated = #64748b
```

### 10.3 Edge styles

```text
SAP_PO = solid blue-gray
EAI = solid purple
API = solid cyan
SQL = dashed green
File = dashed orange
Manual = dotted gray
Unknown = dotted red
```

---

## 11. Documentation Generator

### 11.1 Object page template

Every object should have a generated documentation page.

Template:

```md
# {{display_name}}

## Overview

| Field | Value |
|---|---|
| Object ID | {{object_id}} |
| Type | {{object_type}} |
| Domain | {{domain}} |
| Country | {{country}} |
| Status | {{status}} |
| Owner | {{owner}} |

## Description

{{description}}

## Connectivity

{{mini_graph_or_edge_table}}

## Related Objects

### Source Objects
{{incoming_relationships}}

### Target Objects
{{outgoing_relationships}}

## Interfaces
{{related_interfaces}}

## Processes
{{related_processes}}

## Payloads
{{related_payloads}}

## Tests
{{related_tests}}

## GAPs
{{related_gaps}}

## Documents
{{related_documents}}

## Change History
{{versions}}

## Validation
{{validation_warnings}}
```

### 11.2 Interface page template

```md
# Interface {{interface_code}}

## Overview

| Field | Value |
|---|---|
| Source System | {{source_system}} |
| Target System | {{target_system}} |
| Middleware | {{middleware}} |
| Communication Type | {{communication_type}} |
| Data Type | {{data_type}} |
| Payload Type | {{payload_type}} |
| Frequency | {{frequency}} |
| Status | {{status}} |

## Business Purpose

{{description}}

## Connectivity Path

{{path}}

## Payloads

{{payloads}}

## Related Processes

{{processes}}

## Related Test Cases

{{tests}}

## Related GAPs

{{gaps}}

## Source References

{{source_refs}}

## Open Points / Manual Review

{{manual_review_items}}
```

---

## 12. Test Generation Logic

### 12.1 Inputs

Test generation can be triggered from:

```text
process
interface
path
payload
view/domain
```

### 12.2 Generated test structure

```text
Test ID
Test name
Related process
Related interface
Source system
Target system
Payload
Preconditions
Steps
Expected result
Test data
Validation points
Status
```

### 12.3 Test generation rules

If source and target are known:

```text
Create connectivity test.
```

If interface and payload are known:

```text
Create payload validation test.
```

If process and full path are known:

```text
Create end-to-end process test.
```

If communication type is unknown:

```text
Mark communication validation as manual review.
```

If payload is missing:

```text
Add manual review step: Confirm payload structure and sample message.
```

### 12.4 Example generated test

```md
# TC_WET_001 - Validate Delivery Confirmation Flow

## Scope

Validate that the selected source system can transfer delivery confirmation data through the configured integration path to the target system.

## Preconditions

- Source system is available.
- Target system is available.
- Integration channel is active.
- Test delivery data is prepared.

## Steps

1. Create or identify a delivery confirmation event in the source system.
2. Trigger the relevant interface or integration process.
3. Verify that the message is created in the integration layer.
4. Verify that the message reaches the target system.
5. Validate key business fields in the target system.
6. Check integration logs for errors.

## Expected Result

- Message is transferred successfully.
- Business data is consistent between source and target.
- No mapping, authorization or validation error occurs.

## Manual Review

- Confirm exact payload structure.
- Confirm expected target table/object.
```

---

## 13. Import/Export

### 13.1 Excel workbook structure

Initial import/export workbook:

```text
01_Objects
02_Relationships
03_Interfaces
04_Processes
05_Payloads
06_Tests
07_Documents
08_People
09_ChangeRequests
10_Views
```

### 13.2 Import workflow

```text
1. Upload file.
2. Detect file type.
3. Parse sheets/files.
4. Normalize data to internal model.
5. Validate references and required fields.
6. Show preview:
   - new objects
   - updated objects
   - deleted/missing objects
   - invalid rows
7. User applies import.
8. System creates version snapshots.
9. System updates graph.
```

### 13.3 Export options

```text
Full workspace JSON
Excel workbook
CSV package
Current graph SVG
Current graph PNG
Markdown documentation package
DOCX documentation package
Test cases XLSX
Traceability matrix XLSX
Change request report XLSX
Validation report XLSX
```

### 13.4 JSON workspace format

```json
{
  "workspace": {
    "name": "RITS Graph Workbench",
    "version": "1.0"
  },
  "objects": [],
  "relationships": [],
  "interfaces": [],
  "processes": [],
  "payloads": [],
  "tests": [],
  "documents": [],
  "views": []
}
```

---

## 14. API Design

### 14.1 Object endpoints

```text
GET    /api/objects
GET    /api/objects/:objectId
POST   /api/objects
PATCH  /api/objects/:objectId
DELETE /api/objects/:objectId
GET    /api/objects/:objectId/relationships
GET    /api/objects/:objectId/documentation
GET    /api/objects/:objectId/history
```

### 14.2 Relationship endpoints

```text
GET    /api/relationships
POST   /api/relationships
PATCH  /api/relationships/:relationshipId
DELETE /api/relationships/:relationshipId
```

### 14.3 Graph endpoints

```text
GET  /api/graph/view/:viewId
POST /api/graph/query
POST /api/graph/path
POST /api/graph/neighborhood
```

### 14.4 Import/export endpoints

```text
POST /api/import/preview
POST /api/import/apply
GET  /api/export/workspace.json
GET  /api/export/workbook.xlsx
POST /api/export/documentation
POST /api/export/tests
POST /api/export/graph-image
```

### 14.5 Generation endpoints

```text
POST /api/generate/documentation/:objectId
POST /api/generate/tests/object/:objectId
POST /api/generate/tests/path
POST /api/generate/traceability
```

### 14.6 Validation endpoints

```text
GET  /api/validation/summary
GET  /api/validation/issues
POST /api/validation/run
```

---

## 15. Validation Rules

### 15.1 Object validation

```text
object_id required
object_type required
name required
object_type must be known enum
status must be known enum
owner must exist if provided
domain must be known enum if provided
```

### 15.2 Relationship validation

```text
source_object_id required
target_object_id required
source must exist
target must exist
relationship_type required
relationship_type must be known enum
communication_type must be known enum if provided
interface_code must exist if provided
relationship cannot point to itself unless relationship_type allows it
```

### 15.3 Interface validation

```text
interface_code required
interface object must exist
source_system should exist
target_system should exist
communication_type should be provided
payload_type should be provided or marked unknown/manual_review
```

### 15.4 Process validation

```text
process object must exist
process level should be known enum
parent process must exist if provided
process should have at least one related system or interface unless intentionally empty
```

### 15.5 Test validation

```text
test_code required
test object must exist
test must link to at least one process/interface/path/object
steps should not be empty
expected_result should not be empty
```

---

## 16. Permissions and Roles

Initial simple roles:

```text
viewer
editor
reviewer
admin
```

### 16.1 Viewer

Can:

- view maps,
- view documentation,
- export selected views if allowed.

Cannot:

- edit objects,
- approve changes.

### 16.2 Editor

Can:

- create draft objects,
- edit draft relationships,
- import data,
- create change requests.

Cannot:

- publish changes.

### 16.3 Reviewer

Can:

- review changes,
- approve/reject,
- publish objects,
- resolve validation issues.

### 16.4 Admin

Can:

- manage users,
- manage enums,
- manage connectors,
- run migrations,
- manage system settings.

---

## 17. Change Workflow

### 17.1 Object lifecycle

```text
Draft -> In Review -> Approved -> Published
Draft -> Rejected
Published -> Deprecated
```

### 17.2 Relationship lifecycle

```text
Draft -> Manual Review -> Confirmed -> Published
Draft -> Rejected
Published -> Deprecated
```

### 17.3 Change request flow

```text
1. User creates change request.
2. User links affected objects.
3. User proposes changed objects/relationships.
4. Validation engine runs.
5. Reviewer approves or rejects.
6. Approved change is published.
7. Documentation and graph views are regenerated.
```

---

## 18. SharePoint Connector Later

SharePoint should be implemented as an optional adapter.

### 18.1 Connector purpose

```text
Import existing HIVE2 lists
Export selected objects
Publish generated documentation links
Sync selected fields
```

### 18.2 Connector should map SharePoint list rows to internal model

Example mapping:

```text
SharePoint Interface list -> interfaces + objects + relationships
SharePoint GAP list -> gap objects + relationships
SharePoint Affected System List -> system objects
SharePoint Process List -> process objects
```

### 18.3 Connector modes

```text
read_only_import
manual_export
bidirectional_sync_later
```

Do not start with bidirectional sync. It creates conflict complexity too early.

---

## 19. Docker Compose Blueprint

Recommended services:

```yaml
services:
  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:4000
    depends_on:
      - api

  api:
    build: ./apps/api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://rits:rits@postgres:5432/rits_graph
      - NODE_ENV=production
    depends_on:
      - postgres

  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=rits
      - POSTGRES_PASSWORD=rits
      - POSTGRES_DB=rits_graph
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  neo4j:
    image: neo4j:latest
    profiles:
      - graph
    environment:
      - NEO4J_AUTH=neo4j/change_me
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"

  caddy:
    image: caddy:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - api

volumes:
  postgres_data:
  neo4j_data:
  caddy_data:
  caddy_config:
```

---

## 20. Repository Structure

```text
rits-graph-workbench/
  apps/
    web/
      app/
      components/
      lib/
      styles/
    api/
      src/
        modules/
          objects/
          relationships/
          graph/
          imports/
          exports/
          validation/
          generation/
          auth/
  packages/
    core/
      src/
        model/
        enums/
        validation/
        graph/
        query-parser/
    importers/
      excel/
      csv/
      json/
      yaml/
    exporters/
      excel/
      markdown/
      docx/
      json/
      image/
    templates/
      documentation/
      tests/
      traceability/
  database/
    migrations/
    seeds/
  docs/
    blueprint.md
    data-model.md
    api.md
    user-guide.md
  docker-compose.yml
  README.md
```

---

## 21. MVP Scope

The first robust version should include:

```text
1. PostgreSQL data model
2. Object CRUD
3. Relationship CRUD
4. Import Excel/JSON
5. Export Excel/JSON/Markdown
6. 2D graph view
7. Table editor
8. Object detail page
9. Query bar
10. Pathfinding between two objects
11. Saved views
12. Validation panel
13. Basic generated documentation
14. Basic test generation
15. Change status workflow
```

Do not include in MVP:

```text
full SharePoint bidirectional sync
full Neo4j dependency
advanced permissions
multi-tenant model
complex approval workflows
AI auto-mapping without review
production use with real confidential data on personal server
```

---

## 22. Phase Roadmap

### Phase 0 – Blueprint and schema

Deliverables:

```text
application blueprint
SQL schema
Excel import template
JSON workspace schema
UI wireframe
validation rules
```

### Phase 1 – Core application

Deliverables:

```text
Next.js app
API backend
PostgreSQL database
object/relationship CRUD
table editor
basic graph view
```

### Phase 2 – Import/export and validation

Deliverables:

```text
Excel import/export
JSON import/export
validation engine
import preview
change preview
```

### Phase 3 – Query and graph workbench

Deliverables:

```text
query parser
pathfinding
neighborhood view
saved views
filters
```

### Phase 4 – Documentation and test generation

Deliverables:

```text
generated object pages
interface pages
process pages
Markdown export
DOCX export
test generation
traceability matrix
```

### Phase 5 – Enterprise connectors

Deliverables:

```text
SharePoint read-only import connector
SharePoint export connector
Entra ID login
role management
audit reports
```

### Phase 6 – Advanced graph

Deliverables:

```text
Neo4j projection
3D constellation mode
advanced dependency analysis
impact analysis
version comparison
```

---

## 23. Initial Seed Data Examples

### 23.1 Objects

```json
[
  {
    "object_id": "SYS_DOMS",
    "object_type": "system",
    "name": "DOMS Controller",
    "domain": "POS",
    "status": "draft"
  },
  {
    "object_id": "SYS_SAP_PO",
    "object_type": "system",
    "name": "SAP PO",
    "domain": "Integration",
    "status": "draft"
  },
  {
    "object_id": "SYS_SAP_CAR",
    "object_type": "system",
    "name": "SAP CAR",
    "domain": "RITS",
    "status": "draft"
  },
  {
    "object_id": "IF_RITS_009",
    "object_type": "interface",
    "name": "IF_RITS_009",
    "domain": "WET",
    "status": "manual_review"
  }
]
```

### 23.2 Relationships

```json
[
  {
    "relationship_id": "REL_0001",
    "source_object_id": "SYS_DOMS",
    "target_object_id": "SYS_SAP_PO",
    "relationship_type": "sends_to",
    "communication_type": "SAP_PO",
    "data_type": "transactional_data",
    "status": "manual_review"
  },
  {
    "relationship_id": "REL_0002",
    "source_object_id": "SYS_SAP_PO",
    "target_object_id": "SYS_SAP_CAR",
    "relationship_type": "sends_to",
    "communication_type": "SAP_PO",
    "data_type": "transactional_data",
    "status": "manual_review"
  }
]
```

---

## 24. AI Agent Implementation Instructions

An AI agent implementing this application should follow these rules:

1. Build the data model first.
2. Do not hardcode RITS data into UI components.
3. Treat every map as a generated view over objects and relationships.
4. Keep SharePoint optional and adapter-based.
5. Implement import validation before applying imports.
6. Implement pathfinding over relationships.
7. Generate documentation from object metadata and relationships.
8. Generate tests only from known data; unknown fields must be marked as manual review.
9. Keep the UI simple: explorer, graph, detail panel, table editor.
10. Version every object and relationship change.
11. Use PostgreSQL as the master source of truth.
12. Use Neo4j only as optional graph projection/index.
13. Use Docker Compose for deployment.
14. Never assume confidential internal data can be deployed to personal/external infrastructure.
15. Use demo/anonymized data unless approved otherwise.

---

## 25. Definition of Done for MVP

MVP is complete when:

- user can create/edit objects,
- user can create/edit relationships,
- user can import Excel/JSON data,
- user can validate imported data,
- user can view graph map,
- user can search objects,
- user can run `path A -> B`,
- user can open object detail page,
- user can export workspace to Excel/JSON,
- user can generate Markdown documentation for selected object/view,
- user can generate basic tests for selected interface/process/path,
- all data changes are versioned,
- app can run through Docker Compose.

---

## 26. Final Target Statement

RITS Graph Workbench should become a simple but powerful internal workbench where users can maintain architecture, process, interface, payload, GAP, test and ownership data in one connected model.

The application should feel simple for users:

```text
Search -> Map -> Detail -> Edit -> Export
```

But internally it should be robust:

```text
Objects -> Relationships -> Validation -> Generation -> Traceability
```

The correct long-term direction is:

```text
PostgreSQL-first
Graph-ready model
SharePoint-later adapter
Generated documentation
Generated tests
Pathfinding and impact analysis
Docker-deployable application
```

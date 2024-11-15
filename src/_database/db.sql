create table Business
(
    Id        bigint not null
        constraint PK_a185fd060148157900126b052eb
            primary key,
    Code      nvarchar(500)
        constraint UQ_c16db0121cee0db757496b7b8d5
            unique,
    Name      nvarchar(500),
    CreatedAt datetime default getdate(),
    UpdatedAt datetime default getdate(),
    DeletedAt datetime
)
go

create unique index Business_pk2
    on Business (Code)
go

create unique index Business_pk
    on Business (Id)
go

create index Business_Id_Code_Name_index
    on Business (Id, Code, Name)
go

create table CompanyBusinessMapping
(
    BusinessId bigint not null,
    CompanyId  bigint not null,
    constraint PK_d329e1b77b7a01c16549e17d2fe
        primary key (BusinessId, CompanyId)
)
go

create index IDX_8479cf14fe5c41c38aa3e182d4
    on CompanyBusinessMapping (BusinessId)
go

create index IDX_0d0acbceb7ea4e547ef5ba1abe
    on CompanyBusinessMapping (CompanyId)
go

create table Province
(
    Id          bigint not null
        constraint PK_76f06583861d3c9ee167e80c682
            primary key,
    Code        nvarchar(500)
        constraint UQ_0b20348929c92f46d150d74a82c
            unique,
    Name        nvarchar(500),
    Type        nvarchar(500),
    CreatedAt   datetime default getdate(),
    UpdatedAt   datetime default getdate(),
    DeletedAt   datetime,
    EnglishName nvarchar(500),
    Slug  nvarchar(255)
)
go

create table District
(
    Id           bigint not null
        constraint PK_6dcc0f21c2adacf8c568c444f3c
            primary key,
    Code         nvarchar(500)
        constraint UQ_a343921f157c83f26986f11550b
            unique,
    Name         nvarchar(500),
    Type         nvarchar(500),
    CreatedAt    datetime default getdate(),
    UpdatedAt    datetime default getdate(),
    DeletedAt    datetime,
    ProvinceName nvarchar(500),
    EnglishName  nvarchar(500),
    ProvinceId   bigint
        constraint FK_41111858943aff66203b07c359c
            references Province
)
go

create table Company
(
    Id             bigint not null
        constraint PK_5f471f29996cc218989cd4dc164
            primary key,
    TaxCode        nvarchar(500)
        constraint UQ_edd387a275b4f8588c0832ca6e4
            unique,
    Name           nvarchar(500),
    Description    nvarchar(4000),
    CreatedAt      datetime default getdate(),
    UpdatedAt      datetime default getdate(),
    DeletedAt      datetime,
    Representative nvarchar(500),
    MainBusiness   nvarchar(500),
    Address        nvarchar(500),
    IssuedAt       datetime,
    CurrentStatus  nvarchar(500),
    AlternateName  nvarchar(500),
    ProvinceId     bigint
        constraint FK_c03418fec0dd7bcc315496338df
            references Province,
    DistrictId     bigint
        constraint FK_2e306a5c2dc990da2e293439190
            references District,
    MainBusinessId bigint,
    Slug           nvarchar(2048)
)
go

create unique index Company_pk2
    on Company (TaxCode)
go

create unique index Company_pk
    on Company (Id)
go

create index Company_Id_TaxCode_Name_index
    on Company (Id, TaxCode, Name)
go

create unique index District_pk2
    on District (Code)
go

create unique index District_pk
    on District (Id)
go

create index District_Id_Code_Name_index
    on District (Id, Code, Name)
go

create unique index Province_pk2
    on Province (Code)
go

create unique index Province_pk
    on Province (Id)
go

create index Province_Id_Code_Name_index
    on Province (Id, Code, Name)
go

create table ProvinceGroup
(
    Id            bigint identity
        constraint ProvinceGroup_pk
            primary key,
    Code          nvarchar(255),
    Name          nvarchar(255),
    Link          nvarchar(255),
    Pages         bigint,
    LastPageCount bigint,
    Total         bigint
)
go

create table Ward
(
    Id           bigint not null
        constraint PK_aef8828d183e418b8a7f32f5a50
            primary key,
    Code         nvarchar(500),
    Name         nvarchar(500),
    Type         nvarchar(500),
    CreatedAt    datetime default getdate(),
    UpdatedAt    datetime default getdate(),
    DeletedAt    datetime,
    DistrictName nvarchar(500),
    ProvinceName nvarchar(500),
    EnglishName  nvarchar(500),
    DistrictId   bigint
        constraint FK_d85e4459dfc2f6c7cc3792678ec
            references District,
    ProvinceId   bigint
        constraint FK_1a96644c4cf9386044277319c60
            references Province
)
go

create unique index Ward_pk
    on Ward (Id)
go

create index Ward_Id_Code_Name_index
    on Ward (Id, Code, Name)
go

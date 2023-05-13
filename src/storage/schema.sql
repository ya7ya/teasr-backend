CREATE TABLE
    IF NOT EXISTS users_reputations (
        profile_id VARCHAR(66) NOT NULL,
        reputation INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (profile_id)
    );

CREATE TABLE
    IF NOT EXISTS users_reputations_history (
        profile_id VARCHAR(66) NOT NULL,
        reputation INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (profile_id, created_at)
    );

CREATE TABLE
    IF NOT EXISTS pub_reputations (
        pub_id VARCHAR(66) NOT NULL,
        reputation INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (pub_id)
    );

CREATE TABLE
    IF NOT EXISTS pub_reputations_history (
        pub_id VARCHAR(66) NOT NULL,
        reputation INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (pub_id, created_at)
    );
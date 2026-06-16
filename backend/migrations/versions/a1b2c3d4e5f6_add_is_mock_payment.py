"""add is_mock_payment to subscriptions

Revision ID: a1b2c3d4e5f6
Revises: 87ff3b33e5f5
Create Date: 2026-06-01 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '87ff3b33e5f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('subscriptions', sa.Column('is_mock_payment', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('subscriptions', 'is_mock_payment')

"""Field validators that keep enum-like values anchored to app.core.constants.

Pydantic's `Literal` needs inline literals, which would duplicate every status
string into the schema layer. Validating membership against the constant tuple
keeps constants.py the single source of truth.
"""

from collections.abc import Sequence


def one_of(value: str, choices: Sequence[str]) -> str:
    """Raise for a value outside `choices`; the message lists what is allowed."""
    if value not in choices:
        raise ValueError(f"must be one of: {', '.join(choices)}")
    return value

from transformers import pipeline
from typing import Literal

# Zero Shot Classifier Model (DeBERTa-v3-xsmall-mnli-xnli)
classifier = pipeline(
    "zero-shot-classification",
    model="typeform/distilbert-base-uncased-mnli",
    device=-1,   # CPU，Options: -1 (cpu) or 0 (cuda)
    token=False
)

def classify_necessity(product_name: str) -> Literal["essential", "non_essential", "luxury"]:

    candidate_labels = ["essential", "non essential", "luxury"]
    # Support multilanguage
    result = classifier(product_name, candidate_labels)
    top_label = result["labels"][0]
    # Buzzy Mapping
    if top_label == "non essential":
        top_label = "non_essential"
    return top_label  # type: ignore